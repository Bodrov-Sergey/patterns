import React, { useEffect, useState } from "react"
import _ from "lodash"

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
    action: (
      enemy: IUnitInter[],
      friendly: IUnitInter[],
      index: number,
      setter: (army: IUnitInter[]) => void
    ) => void
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
    cloneable: true
  }

  interface BattleInter {
    blueArmy: IUnitInter[]
    redArmy: IUnitInter[]
    armyAttack: (attack: IUnitInter[], defensive: IUnitInter[]) => void
    armySpecialAttack: (attack: IUnitInter[], defensive: IUnitInter[]) => void
    clearField: () => void
    makeMove: (move: number, updateMove: () => void) => BattleInter
  }

  // HELPERS
  const getAvaliable = (
    enemy: IUnitInter[],
    friendly: IUnitInter[],
    index: number,
    sar: number
  ) => {}
  const healAction = (healpoint: number, context: IUnitInter & IHealable) => {
    if (context.HitPoints > 0) {
      if (context.HitPoints + healpoint > context.MaxHp) {
        context.HitPoints = context.MaxHp
        console.log(
          `Целительница полностью восстанавливает здоровье у ${context.UnitName}`
        )
      } else {
        context.HitPoints += healpoint
        console.log(
          `Целительница восстанавливает ${healpoint} единиц здоровья у ${context.UnitName}`
        )
      }
    } else {
      console.log(
        `Целительница пытается вылечить уже мёртвого ${context.UnitName}`
      )
    }
  }
  const getRandUnit = (units: IUnitInter[]) => {
    return units[Math.floor(Math.random() * units.length)]
  }
  function isIHealable(object: any): object is IHealable {
    return "heal" in object
  }
  function isICloneable(object: any): object is ICloneable {
    return "cloneable" in object
  }
  function isIBuffable(object: any): object is IBuffable {
    return "buff" in object
  }
  function isISpecialAbility(object: any): object is ISpecialAbility {
    return "Range" in object
  }

  // BASE UNIT CLASS
  abstract class IUnit implements IUnitInter {
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
      console.log(
        `${this.UnitName} получает ${
          attackPoints * (armyPrice / (armyPrice + this.Defense))
        } урона ${
          this.HitPoints -
            attackPoints * (armyPrice / (armyPrice + this.Defense)) <=
          0
            ? "и погибает"
            : ""
        }`
      )
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
      console.log(
        `${this.UnitName} поглащает ${attackPoints} урона ${
          this.HitPoints - attackPoints <= 0 ? "и разрушается" : ""
        }`
      )
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
      this.action = (enemy, friendly, index) => {
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
            console.log(
              `${this.UnitName} надевает ${random} на ${randUnit.UnitName}!`
            )
          } else {
            console.log(`${this.UnitName} не находит союзника для бафа...`)
          }
        }
      }
    }
    readonly Range: number
    readonly Strangth: number
    action: (
      enemy: IUnitInter[],
      friendly: IUnitInter[],
      index: number,
      setter: (army: IUnitInter[]) => void
    ) => void
    readonly MaxHp: number
    heal: (heal: number) => void
  }

  class HeavyIntantry extends IUnit implements ICloneable, IBuffable {
    constructor() {
      super("Варвар", 3, 2, 5)
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
    cloneable: true = true
    buffed: buffVariants | null
    buff: (buff: buffVariants) => void
  }
  class HeavyIntantryDecorator extends IUnit implements ICloneable, IBuffable {
    constructor(unit: HeavyIntantry) {
      super(unit.UnitName, unit.HitPoints, unit.Attack, unit.Defense)

      this.buffed = unit.buffed
      this.buff = unit.buff
      this.unit = unit
    }
    unit: HeavyIntantry
    takeDamage(attackPoints: number): void {
      this.unit.takeDamage.call(this, attackPoints)
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
    cloneable: true = true
    buffed: buffVariants | null
    buff: (buff: buffVariants) => void
  }
  class Knight extends IUnit implements ICloneable {
    constructor() {
      super("П.Е.К.К.А", 4, 6, 0)
    }
    cloneable: true = true
  }
  class Archer extends IUnit implements ISpecialAbility, IHealable {
    constructor() {
      super("Лучница", 6, 3, 1)
      this.Range = 2
      this.Strangth = 3
      this.action = (enemy, friendly, index) => {
        if (enemy.length) {
          const randUnit = getRandUnit(enemy)
          console.log(`${this.UnitName} стреляет!`)
          randUnit.takeDamage(this.Strangth)
        } else {
          console.log(`${this.UnitName} не смогла прицелиться...`)
        }
      }
      this.MaxHp = 6
      this.heal = (heal) => {
        healAction(heal, this)
      }
    }
    readonly Range: number
    readonly Strangth: number
    action: (
      enemy: IUnitInter[],
      friendly: IUnitInter[],
      index: number,
      setter: (army: IUnitInter[]) => void
    ) => void
    readonly MaxHp: number
    heal: (heal: number) => void
  }
  class Healer extends IUnit implements ISpecialAbility, IHealable {
    constructor() {
      super("Целительница", 6, 3, 1)
      this.Range = 2
      this.Strangth = 3
      this.action = (enemy, friendly, index) => {
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
    action: (
      enemy: IUnitInter[],
      friendly: IUnitInter[],
      index: number,
      setter: (army: IUnitInter[]) => void
    ) => void
    readonly MaxHp: number
    heal: (heal: number) => void
  }
  class Warlock extends IUnit implements ISpecialAbility {
    constructor() {
      super("Колдун", 6, 3, 1)
      this.Range = 2
      this.Strangth = 3
      this.action = (enemy, friendly, index, setter) => {
        if (friendly.length) {
          const randUnit = getRandUnit(friendly)
          if (
            isICloneable(randUnit) &&
            Math.floor(Math.random() * 100 + 1) <= this.Strangth
          ) {
            const newArmy: IUnitInter[] = []
            friendly.forEach((el, i) => {
              if (i === index) {
                newArmy.push(_.cloneDeep(randUnit))
              }
              newArmy.push(el)
            })
            setter(newArmy)
            console.log(
              `${this.UnitName} успешно использует заклинание, чтобы склонировать ${randUnit.UnitName}`
            )
          } else {
            console.log(`${this.UnitName} не совладал со своими чарами...`)
          }
        }
      }
    }
    readonly Range: number
    readonly Strangth: number
    action: (
      enemy: IUnitInter[],
      friendly: IUnitInter[],
      index: number,
      setter: (army: IUnitInter[]) => void
    ) => void
  }
  class GulyayGorodAdapter extends IUnit {
    constructor(unit: GulyayGorodInter) {
      super(unit.UnitName, unit.HitPoints, 0, 0)
      this.unit = unit
    }
    unit: GulyayGorodInter
    takeDamage(attackPoints: number): void {
      this.unit.takeAttack.call(this, attackPoints)
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

  abstract class AbstractFactory {
    createUnit(): void {}
  }
  class LightIntantryFactory extends AbstractFactory {
    createUnit(): IUnitInter {
      return new LightIntantry()
    }
  }
  class HeavyIntantryFactory extends AbstractFactory {
    createUnit(): IUnitInter {
      let HeavyUnit = new HeavyIntantry()
      return new HeavyIntantryDecorator(HeavyUnit)
    }
  }
  class ArcherFactory extends AbstractFactory {
    createUnit(): IUnitInter {
      return new Archer()
    }
  }
  class HealerFactory extends AbstractFactory {
    createUnit(): IUnitInter {
      return new Healer()
    }
  }
  class WarlockFactory extends AbstractFactory {
    createUnit(): IUnitInter {
      return new Warlock()
    }
  }
  class KnightFactory extends AbstractFactory {
    createUnit(): IUnitInter {
      return new Knight()
    }
  }
  class GulyayGorodFactory extends AbstractFactory {
    createUnit(): IUnitInter {
      const GulyayGorodUnit = new GulyayGorod()
      return new GulyayGorodAdapter(GulyayGorodUnit)
    }
  }

  class ArmyCreate {
    createArmy(unitsAvaliable: UnitName[]): IUnitInter[] {
      const getUnitByName = (name: UnitName) => {
        switch (name) {
          case "Гоблин":
            const unitLight = new LightIntantryFactory()
            return unitLight.createUnit()
          case "Варвар":
            const unitHeavy = new HeavyIntantryFactory()
            return unitHeavy.createUnit()
          case "Лучница":
            const unitArcher = new ArcherFactory()
            return unitArcher.createUnit()
          case "Целительница":
            const unitHealer = new HealerFactory()
            return unitHealer.createUnit()
          case "Колдун":
            const unitWarlock = new WarlockFactory()
            return unitWarlock.createUnit()
          case "П.Е.К.К.А":
            const unitKnight = new KnightFactory()
            return unitKnight.createUnit()
          case "Гуляй-город":
            const unitGulyayGorod = new GulyayGorodFactory()
            return unitGulyayGorod.createUnit()
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
  const [activeUnits, setActiveUnits] = useState<UnitName[]>([
    "Варвар",
    "Гоблин",
    "Колдун",
    "Лучница",
    "Целительница",
    "Гуляй-город",
    "П.Е.К.К.А",
  ])
  const [battle, setBattle] = useState<Battle | null>(null)
  const [activeMove, setActiveMove] = useState(1)

  class Battle implements BattleInter {
    constructor() {
      const army = new ArmyCreate()
      this.blueArmy = army.createArmy(activeUnits)
      this.redArmy = army.createArmy(activeUnits)
    }
    blueArmy: IUnitInter[]
    redArmy: IUnitInter[]
    armyAttack(attack: IUnitInter[], defensive: IUnitInter[]): void {
      defensive[0].takeDamage(attack[0].Attack)
    }
    armySpecialAttack(attack: IUnitInter[], defensive: IUnitInter[]): void {
      attack.forEach((el, index) => {
        if (index !== 0 && isISpecialAbility(el)) {
          el.action(defensive, attack, index, (army: IUnitInter[]) => {
            attack = army
          })
        }
      })
    }
    clearField() {
      this.blueArmy = this.blueArmy.filter((el) => el.HitPoints > 0)
      this.redArmy = this.redArmy.filter((el) => el.HitPoints > 0)
    }
    makeMove(moveIndex: number, updateMove: () => void): Battle {
      if (moveIndex % 2 === 1) {
        this.armyAttack(this.blueArmy, this.redArmy)
        this.armySpecialAttack(this.blueArmy, this.redArmy)
      } else {
        this.armyAttack(this.redArmy, this.blueArmy)
        this.armySpecialAttack(this.redArmy, this.blueArmy)
      }
      this.clearField()
      updateMove()
      return this
    }
  }

  return (
    <>
      {battle ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              {battle.blueArmy.map((el, index) => (
                <div key={el.UnitName + index}>
                  {el.UnitName} {el.HitPoints}
                </div>
              ))}
            </div>
            <div>Ход: {activeMove}</div>
            <div>
              {battle.redArmy.map((el, index) => (
                <div key={el.UnitName + index}>
                  {el.UnitName} {el.HitPoints}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={async () => {
              setBattle(
                _.cloneDeep(
                  battle.makeMove(activeMove, () => {
                    setActiveMove(activeMove + 1)
                  })
                )
              )
            }}
            disabled={!battle.blueArmy.length || !battle.redArmy.length}
          >
            Атаковать
          </button>
        </>
      ) : (
        <button
          onClick={async () => {
            setBattle(new Battle())
          }}
        >
          Создать битву
        </button>
      )}
    </>
  )
}

export default App
