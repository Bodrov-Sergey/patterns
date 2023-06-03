import React, { useEffect, useState } from "react"

const App = () => {
  // INTERFACES
  interface IUnitInter {
    Attack: number
    Defense: number
    HitPoints: number
    UnitName: string
    takeDamage: (attackPoints: number) => void
  }
  interface GulyayGorodInter {
    HitPoints: number
    UnitName: string
    takeAttack: (attackPoints: number) => void
  }
  interface ISpecialAbility {
    Range: number
    Strangth: number
    action: (enemy: IUnitInter[], friendly: IUnitInter[]) => void
  }
  interface IHealable {
    MaxHp: number
    heal: (heal: number) => void
  }
  type buffVariants = "Шлем" | "Щит" | "Конь"
  interface IBuffable {
    buffed: buffVariants | null
    buff: (buff: buffVariants) => void
  }
  interface ICloneable {
    clone: (
      myArmy: IUnitInter[],
      setMyArmy: (army: IUnitInter[]) => void
    ) => void
  }

  interface Battle {
    blueArmy: IUnitInter[]
    redArmy: IUnitInter[]
    armyAttack: (attack: IUnitInter, defensive: IUnitInter) => void
    armySpecialAttack: (attack: IUnitInter[], defensive: IUnitInter[]) => void
    clearField: (blueArmy: IUnitInter[], redArmy: IUnitInter[]) => void
  }

  // HELPERS
  const healAction = (healpoint: number, context: IUnitInter & IHealable) => {
    if (context.HitPoints > 0) {
      if (context.HitPoints + healpoint > context.MaxHp) {
        context.HitPoints = context.MaxHp
      } else {
        context.HitPoints += healpoint
      }
    }
  }
  const getRandUnit = (units: IUnitInter[]) => {
    return units[Math.floor(Math.random() * units.length)]
  }
  function isIHealable(object: any): object is IHealable {
    return "heal" in object
  }
  function isICloneable(object: any): object is ICloneable {
    return "heal" in object
  }
  function isIBuffable(object: any): object is IBuffable {
    return "buff" in object
  }
  function isISpecialAbility(object: any): object is ISpecialAbility {
    return "Range" in object
  }

  // BASE UNIT CLASS
  class IUnit implements IUnitInter {
    constructor(
      UnitName: string,
      HitPoints: number,
      Attack?: number,
      Defense?: number
    ) {
      this.UnitName = UnitName
      this.HitPoints = HitPoints
      this.Attack = Attack || 0
      this.Defense = Defense || 0
    }
    Attack: number
    Defense: number
    HitPoints: number
    readonly UnitName: string

    takeDamage(attackPoints: number) {
      this.HitPoints =
        this.HitPoints - attackPoints * (armyPrice / (armyPrice + this.Defense))
    }
  }
  class GulyayGorod implements GulyayGorodInter {
    constructor() {
      this.UnitName = "Гуляй-Город"
      this.HitPoints = 15
    }
    HitPoints: number
    readonly UnitName: string
    takeAttack(attackPoints: number) {
      this.HitPoints = this.HitPoints - attackPoints
    }
  }

  // UNITS
  class LightIntantry extends IUnit implements IHealable, ISpecialAbility {
    constructor() {
      super("Гоблин", 6, 3, 1)
      this.MaxHp = 6
      this.heal = (heal) => {
        healAction(heal, this)
      }
      this.Range = 1
      this.Strangth = 10
      this.action = (enemy, friendly) => {
        if (friendly.length) {
          const randUnit = getRandUnit(friendly)
          if (
            Math.floor(Math.random() * 100 + 1) <= this.Strangth &&
            isIBuffable(randUnit)
          ) {
            const buffVariants: buffVariants[] = ["Шлем", "Щит", "Конь"]
            const random =
              buffVariants[Math.floor(Math.random() * buffVariants.length)]
            randUnit.buff(random)
          }
        }
      }
    }
    readonly Range: number
    readonly Strangth: number
    action: (enemy: IUnitInter[], friendly: IUnitInter[]) => void
    readonly MaxHp: number
    heal: (heal: number) => void
  }

  class HeavyIntantry extends IUnit implements ICloneable, IBuffable {
    constructor() {
      super("Варвар", 3, 2, 5)
      this.clone = () => {}
      this.buffed = null
      this.buff = (buff) => {
        if (!this.buffed) {
          this.buffed = buff
          switch (buff) {
            case "Шлем":
              this.Defense *= 2
              break
            case "Щит":
              this.Defense *= 3
              break
            case "Конь":
              this.Attack *= 2
              break
            default:
              return
          }
        }
      }
    }
    clone: (
      myArmy: IUnitInter[],
      setMyArmy: (army: IUnitInter[]) => void
    ) => void
    buffed: buffVariants | null
    buff: (buff: buffVariants) => void
  }
  class HeavyIntantryDecorator extends IUnit implements ICloneable, IBuffable {
    constructor(unit: IUnitInter & ICloneable & IBuffable) {
      super(unit.UnitName, unit.HitPoints, unit.Attack, unit.Defense)
      this.clone = unit.clone
      this.buffed = unit.buffed
      this.buff = unit.buff
      this.unit = unit
    }
    unit: IUnitInter & ICloneable & IBuffable
    takeDamage(attackPoints: number): void {
      this.unit.takeDamage(attackPoints)
      if (this.buffed && Math.floor(Math.random() * 2) === 0) {
        switch (this.buffed) {
          case "Шлем":
            this.Defense = this.Defense / 2
            break
          case "Щит":
            this.Defense = this.Defense / 3
            break
          case "Конь":
            this.Attack = this.Attack / 2
            break
          default:
            break
        }
        this.buffed = null
      }
    }
    clone: (
      myArmy: IUnitInter[],
      setMyArmy: (army: IUnitInter[]) => void
    ) => void
    buffed: buffVariants | null
    buff: (buff: buffVariants) => void
  }
  class Knight extends IUnit implements ICloneable {
    constructor() {
      super("Knight", 4, 6, 0)
      this.clone = () => {}
    }
    clone: (
      myArmy: IUnitInter[],
      setMyArmy: (army: IUnitInter[]) => void
    ) => void
  }
  class Archer extends IUnit implements ISpecialAbility, IHealable {
    constructor() {
      super("Лучница", 6, 3, 1)
      this.Range = 2
      this.Strangth = 3
      this.action = (enemy, friendly) => {
        if (enemy.length) {
          const randUnit = getRandUnit(enemy)
          randUnit.takeDamage(this.Strangth)
        }
      }
      this.MaxHp = 6
      this.heal = (heal) => {
        healAction(heal, this)
      }
    }
    readonly Range: number
    readonly Strangth: number
    action: (enemy: IUnitInter[], friendly: IUnitInter[]) => void
    readonly MaxHp: number
    heal: (heal: number) => void
  }
  class Healer extends IUnit implements ISpecialAbility, IHealable {
    constructor() {
      super("Целительница", 6, 3, 1)
      this.Range = 2
      this.Strangth = 3
      this.action = (enemy, friendly) => {
        if (friendly.length) {
          const randUnit = getRandUnit(friendly)
          if (isIHealable(randUnit)) {
            randUnit.heal(this.Strangth)
          }
        }
      }
      this.MaxHp = 6
      this.heal = (heal) => {
        healAction(heal, this)
      }
    }
    readonly Range: number
    readonly Strangth: number
    action: (enemy: IUnitInter[], friendly: IUnitInter[]) => void
    readonly MaxHp: number
    heal: (heal: number) => void
  }
  class Warlock extends IUnit implements ISpecialAbility {
    constructor() {
      super("Колдун", 6, 3, 1)
      this.Range = 2
      this.Strangth = 3
      this.action = (enemy, friendly) => {
        if (friendly.length) {
          const randUnit = getRandUnit(friendly)
          if (
            isICloneable(randUnit) &&
            Math.floor(Math.random() * 100 + 1) <= this.Strangth
          ) {
            randUnit.clone([], () => {})
          }
        }
      }
    }
    readonly Range: number
    readonly Strangth: number
    action: (enemy: IUnitInter[], friendly: IUnitInter[]) => void
  }
  class GulyayGorodAdapter extends IUnit {
    constructor(unit: GulyayGorodInter) {
      super(unit.UnitName, unit.HitPoints, 0, 0)
      this.unit = unit
    }
    unit: GulyayGorodInter
    takeDamage(attackPoints: number): void {
      this.unit.takeAttack(attackPoints)
    }
  }

  // ARMY

  const armyPrice = 100 // ТУТ ДОЛЖЕН БЫТЬ МИНИМУМ - НЕ ЗАБУДЬ ЕСЛИ БУДЕТ ЮАЙ
  type UnitName =
    | "Гоблин"
    | "Варвар"
    | "П.Е.К.К.А"
    | "Гуляй-город"
    | "Лучница"
    | "Целительница"
    | "Колдун"

  class ArmyFactory {
    constructor() {
      this.createArmy = (unitsAvaliable) => {
        const getUnitByName = (name: UnitName) => {
          switch (name) {
            case "Гоблин":
              return new LightIntantry()
            case "Варвар":
              let HeavyUnit = new HeavyIntantry()
              return new HeavyIntantryDecorator(HeavyUnit)
            case "Лучница":
              return new Archer()
            case "Целительница":
              return new Healer()
            case "Колдун":
              return new Warlock()
            case "П.Е.К.К.А":
              return new Knight()
            case "Гуляй-город":
              const GulyayGorodUnit = new GulyayGorod()
              return new GulyayGorodAdapter(GulyayGorodUnit)
          }
        }
        // массив с ценами каждого юнита чтобы потом понять можно ли еще добавить
        const prices = unitsAvaliable.map((el) => {
          const unit = getUnitByName(el)
          return (
            unit.Attack +
            unit.Defense +
            unit.HitPoints +
            (isISpecialAbility(unit) ? (unit.Range + unit.Strangth) * 2 : 0)
          )
        })

        let currentResidue = armyPrice
        const resultArmy: IUnitInter[] = []
        while (true) {
          const randomUnit = getUnitByName(
            unitsAvaliable[Math.floor(Math.random() * unitsAvaliable.length)]
          )
          const randomUnitPrice =
            randomUnit.Attack +
            randomUnit.Defense +
            randomUnit.HitPoints +
            (isISpecialAbility(randomUnit)
              ? (randomUnit.Range + randomUnit.Strangth) * 2
              : 0)
          if (currentResidue - randomUnitPrice >= 0 && currentResidue > 0) {
            resultArmy.push(randomUnit)
            currentResidue -= randomUnitPrice
            // eslint-disable-next-line no-loop-func
          } else if (!prices.filter((el) => el <= currentResidue).length) {
            break
          }
        }
        return resultArmy
      }
    }
    createArmy: (units: UnitName[]) => IUnitInter[]
  }
  const army = new ArmyFactory()
  const [myArmy, setMyArmy] = useState(
    army.createArmy([
      "Варвар",
      "Гоблин",
      "Колдун",
      "Лучница",
      "Целительница",
      "Гуляй-город",
    ])
  )
  const [enemyArmy, setEnemyArmy] = useState(
    army.createArmy([
      "Варвар",
      "Гоблин",
      "Колдун",
      "Лучница",
      "Целительница",
      "Гуляй-город",
    ])
  )

  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        {myArmy.map((el) => (
          <div>{el.UnitName}</div>
        ))}
      </div>
      <div>
        {enemyArmy.map((el) => (
          <div>{el.UnitName}</div>
        ))}
      </div>
    </div>
  )
}

export default App
