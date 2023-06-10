import React, { useState } from "react"
import "./App.scss"
import _ from "lodash"

const App = () => {
  // INTERFACES
  interface IUnitInter {
    Attack: number
    Defense: number
    HitPoints: number
    UnitName: string
    takeDamage: (attackPoints: number, logSetter: (log: string) => void) => void
  }
  interface GulyayGorodInter {
    HitPoints: number
    UnitName: string
    takeAttack: (attackPoints: number, logSetter: (log: string) => void) => void
  }
  interface ISpecialAbility {
    Range: number
    Strangth: number
    action: (
      enemy: IUnitInter[],
      friendly: IUnitInter[],
      index: number,
      setter: (army: IUnitInter[]) => void,
      logSetter: (log: string) => void
    ) => void
  }
  interface IHealable {
    MaxHp: number
    heal: (heal: number, logSetter: (log: string) => void) => void
  }
  type buffVariants = "Шлем" | "Щит" | "Конь"
  interface IBuffable {
    buffed: buffVariants | null
    buff: (buff: buffVariants) => void
  }
  interface ICloneable {
    cloneable: true
  }
  type UnitName =
    | "Гоблин"
    | "Варвар"
    | "П.Е.К.К.А"
    | "Гуляй-город"
    | "Лучница"
    | "Целительница"
    | "Колдун"

  interface BattleInter {
    blueArmy: IUnitInter[]
    redArmy: IUnitInter[]
    activeMove: number
    armyAttack: (
      attack: IUnitInter[],
      defensive: IUnitInter[],
      logSetter: (log: string) => void
    ) => void
    armySpecialAttack: (
      attack: IUnitInter[],
      defensive: IUnitInter[],
      toClone: "blue" | "red",
      logSetter: (log: string) => void
    ) => void
    clearField: () => void
  }
  interface BattleProxyInter {
    makeMove: (
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ) => BattleInter
    makeFight: (
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ) => BattleInter
    goForward: (
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ) => BattleInter
    goBack: (
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ) => BattleInter
  }

  // HELPERS
  const getAvaliable = (
    enemy: IUnitInter[],
    friendly: IUnitInter[],
    index: number,
    sar: number
  ) => {
    return {
      avaliableEnemy: enemy.filter((el, i) => i <= sar - index - 1),
      avaliableFriendly: friendly.filter(
        (el, i) => i >= index - sar && i <= index + sar && i !== index
      ),
    }
  }
  const healAction = (
    healpoint: number,
    context: IUnitInter & IHealable,
    logSetter: (log: string) => void
  ) => {
    if (context.HitPoints > 0) {
      if (context.HitPoints + healpoint > context.MaxHp) {
        context.HitPoints = context.MaxHp
        logSetter(
          `Целительница полностью восстанавливает здоровье у ${context.UnitName}`
        )
      } else {
        context.HitPoints += healpoint
        logSetter(
          `Целительница восстанавливает ${healpoint} единиц здоровья у ${context.UnitName}`
        )
      }
    } else {
      logSetter(
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
      Attack: number,
      Defense: number
    ) {
      this.UnitName = UnitName
      this.HitPoints = HitPoints
      this.Attack = Attack
      this.Defense = Defense
    }
    Attack: number
    Defense: number
    HitPoints: number
    readonly UnitName: string

    takeDamage(attackPoints: number, logSetter: (log: string) => void) {
      logSetter(
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
    takeAttack(attackPoints: number, logSetter: (log: string) => void) {
      logSetter(
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
      this.heal = (heal, logSetter) => {
        healAction(heal, this, logSetter)
      }
      this.Range = 1
      this.Strangth = 10
      this.action = (enemy, friendly, index, setter, logSetter) => {
        const { avaliableFriendly } = getAvaliable(
          enemy,
          friendly,
          index,
          this.Range
        )
        if (avaliableFriendly.length) {
          const randUnit = getRandUnit(avaliableFriendly)
          if (
            Math.floor(Math.random() * 100 + 1) <= this.Strangth &&
            isIBuffable(randUnit)
          ) {
            const buffVariants: buffVariants[] = ["Шлем", "Щит", "Конь"]
            const random =
              buffVariants[Math.floor(Math.random() * buffVariants.length)]
            randUnit.buff(random)
            logSetter(
              `${this.UnitName} надевает ${random} на ${randUnit.UnitName}!`
            )
          } else {
            logSetter(`${this.UnitName} не находит союзника для бафа...`)
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
      setter: (army: IUnitInter[]) => void,
      logSetter: (log: string) => void
    ) => void
    readonly MaxHp: number
    heal: (heal: number, logSetter: (log: string) => void) => void
  }

  class HeavyIntantry extends IUnit implements ICloneable, IBuffable {
    constructor() {
      super("Варвар", 3, 2, 5)
      this.buffed = null
    }
    cloneable: true = true
    buffed: buffVariants | null
    buff(buff: buffVariants): void {
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
  class HeavyIntantryDecorator extends IUnit implements ICloneable, IBuffable {
    constructor(unit: HeavyIntantry) {
      super(unit.UnitName, unit.HitPoints, unit.Attack, unit.Defense)

      this.buffed = unit.buffed
      this.buff = unit.buff.bind(this)
      this.unit = unit
    }
    unit: HeavyIntantry
    takeDamage(attackPoints: number, logSetter: (log: string) => void): void {
      this.unit.takeDamage.call(this, attackPoints, logSetter)
      if (this.buffed && Math.floor(Math.random() * 2) === 0) {
        logSetter(`${this.UnitName} теряет бафф...`)
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
      this.action = (enemy, friendly, index, setter, logSetter) => {
        const { avaliableEnemy } = getAvaliable(
          enemy,
          friendly,
          index,
          this.Range
        )
        if (avaliableEnemy.length) {
          const randUnit = getRandUnit(avaliableEnemy)

          logSetter(`${this.UnitName} стреляет!`)
          randUnit.takeDamage(this.Strangth, logSetter)
        } else {
          logSetter(`${this.UnitName} не смогла прицелиться...`)
        }
      }
      this.MaxHp = 6
      this.heal = (heal, logSetter) => {
        healAction(heal, this, logSetter)
      }
    }
    readonly Range: number
    readonly Strangth: number
    action: (
      enemy: IUnitInter[],
      friendly: IUnitInter[],
      index: number,
      setter: (army: IUnitInter[]) => void,
      logSetter: (log: string) => void
    ) => void
    readonly MaxHp: number
    heal: (heal: number, logSetter: (log: string) => void) => void
  }
  class Healer extends IUnit implements ISpecialAbility, IHealable {
    constructor() {
      super("Целительница", 6, 3, 1)
      this.Range = 2
      this.Strangth = 3
      this.action = (enemy, friendly, index, setter, logSetter) => {
        const { avaliableFriendly } = getAvaliable(
          enemy,
          friendly,
          index,
          this.Range
        )
        if (avaliableFriendly.length) {
          const randUnit = getRandUnit(avaliableFriendly)
          if (isIHealable(randUnit)) {
            randUnit.heal(this.Strangth, logSetter)
          }
        }
      }
      this.MaxHp = 6
      this.heal = (heal, logSetter) => {
        healAction(heal, this, logSetter)
      }
    }
    readonly Range: number
    readonly Strangth: number
    action: (
      enemy: IUnitInter[],
      friendly: IUnitInter[],
      index: number,
      setter: (army: IUnitInter[]) => void,
      logSetter: (log: string) => void
    ) => void
    readonly MaxHp: number
    heal: (heal: number, logSetter: (log: string) => void) => void
  }
  class Warlock extends IUnit implements ISpecialAbility {
    constructor() {
      super("Колдун", 6, 3, 1)
      this.Range = 2
      this.Strangth = 3
      this.action = (enemy, friendly, index, setter, logSetter) => {
        const { avaliableFriendly } = getAvaliable(
          enemy,
          friendly,
          index,
          this.Range
        )
        if (avaliableFriendly.length) {
          const randUnit = getRandUnit(avaliableFriendly)
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

            logSetter(
              `${this.UnitName} успешно использует заклинание, чтобы склонировать ${randUnit.UnitName}`
            )
          } else {
            logSetter(`${this.UnitName} не совладал со своими чарами...`)
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
      setter: (army: IUnitInter[]) => void,
      logSetter: (log: string) => void
    ) => void
  }
  class GulyayGorodAdapter extends IUnit {
    constructor(unit: GulyayGorodInter) {
      super(unit.UnitName, unit.HitPoints, 0, 0)
      this.unit = unit
    }
    unit: GulyayGorodInter
    takeDamage(attackPoints: number, logSetter: (log: string) => void): void {
      this.unit.takeAttack.call(this, attackPoints, logSetter)
    }
  }

  // ARMY

  const armyPrice = 100 // ТУТ ДОЛЖЕН БЫТЬ МИНИМУМ - НЕ ЗАБУДЬ ЕСЛИ БУДЕТ ЮАЙ

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
  const [logger, setLogger] = useState<string[]>([])
  const [history, setHistory] = useState<BattleInter[]>([])
  const [switchComand, setSwitchComand] = useState<null | Switch>(null)
  const [isDraw, setIsDraw] = useState(false)

  class Battle implements BattleInter {
    constructor() {
      const army = new ArmyCreate()
      this.blueArmy = army.createArmy(activeUnits)
      this.redArmy = army.createArmy(activeUnits)
      this.activeMove = 1
    }
    activeMove: number
    blueArmy: IUnitInter[]
    redArmy: IUnitInter[]

    clearField() {
      this.blueArmy = this.blueArmy.filter((el) => el.HitPoints > 0)
      this.redArmy = this.redArmy.filter((el) => el.HitPoints > 0)
    }
    armyAttack(
      attack: IUnitInter[],
      defensive: IUnitInter[],
      logSetter: (log: string) => void
    ): void {
      defensive[0].takeDamage(attack[0].Attack, logSetter)
    }
    armySpecialAttack(
      attack: IUnitInter[],
      defensive: IUnitInter[],
      toClone: "blue" | "red",
      logSetter: (log: string) => void
    ): void {
      attack.forEach((el, index) => {
        if (index !== 0 && isISpecialAbility(el)) {
          el.action(
            defensive,
            attack,
            index,
            (army: IUnitInter[]) => {
              if (toClone === "red") {
                this.redArmy = _.cloneDeep(army)
              } else {
                this.blueArmy = _.cloneDeep(army)
              }
            },
            logSetter
          )
        }
      })
    }
  }
  class BattleProxy implements BattleProxyInter {
    constructor(battle: BattleInter) {
      this.battle = battle
    }
    battle: BattleInter
    makeMove(
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ): BattleInter {
      if (this.battle.activeMove % 2 === 1) {
        this.battle.armyAttack(
          this.battle.blueArmy,
          this.battle.redArmy,
          logSetter
        )
        this.battle.armySpecialAttack(
          this.battle.blueArmy,
          this.battle.redArmy,
          "blue",
          logSetter
        )
      } else {
        this.battle.armyAttack(
          this.battle.redArmy,
          this.battle.blueArmy,
          logSetter
        )
        this.battle.armySpecialAttack(
          this.battle.redArmy,
          this.battle.blueArmy,
          "red",
          logSetter
        )
      }
      this.battle.clearField()
      this.battle.activeMove += 1
      updateMove(this.battle.activeMove)
      historySetter(this.battle)
      return this.battle
    }
    makeFight(
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ): BattleInter {
      while (this.battle.blueArmy.length && this.battle.redArmy.length) {
        if (this.battle.activeMove > 1000) {
          setIsDraw(true)
          break
        }
        this.makeMove(updateMove, logSetter, historySetter, history)
      }
      return this.battle
    }
    goForward(
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ): BattleInter {
      if (history.length > this.battle.activeMove) {
        updateMove(this.battle.activeMove + 1)
        this.battle.activeMove += 1
        return _.cloneDeep(history[this.battle.activeMove - 1])
      } else {
        return this.battle
      }
    }
    goBack(
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ): BattleInter {
      if (this.battle.activeMove > 1) {
        updateMove(this.battle.activeMove - 1)
        this.battle.activeMove -= 1
        return _.cloneDeep(history[this.battle.activeMove - 1])
      } else {
        return this.battle
      }
    }
  }
  abstract class Command {
    constructor(battle: BattleProxyInter) {
      this.battle = battle
    }
    battle: BattleProxyInter
    operate(
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ): BattleInter {
      return new Battle()
    }
  }
  class MakeMove extends Command {
    operate(
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ): BattleInter {
      return this.battle.makeMove.call(
        this.battle,
        updateMove,
        logSetter,
        historySetter,
        history
      )
    }
  }
  class MakeFight extends Command {
    operate(
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ): BattleInter {
      return this.battle.makeFight.call(
        this.battle,
        updateMove,
        logSetter,
        historySetter,
        history
      )
    }
  }
  class GoBack extends Command {
    operate(
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ): BattleInter {
      return this.battle.goBack.call(
        this.battle,
        updateMove,
        logSetter,
        historySetter,
        history
      )
    }
  }
  class GoForward extends Command {
    operate(
      updateMove: (stage: number) => void,
      logSetter: (log: string) => void,
      historySetter: (history: BattleInter) => void,
      history: BattleInter[]
    ): BattleInter {
      return this.battle.goForward.call(
        this.battle,
        updateMove,
        logSetter,
        historySetter,
        history
      )
    }
  }
  class Switch {
    constructor(battle: BattleInter) {
      this.history = [_.cloneDeep(battle)]
      this.log = []
    }
    history: BattleInter[]
    log: string[]
    switchExecute(
      comand: Command,
      updateMove: (stage: number) => void
    ): BattleInter {
      const res = comand.operate(
        updateMove,
        (log) => {
          this.log = [...this.log, log]
        },
        (history) => {
          this.history = [...this.history, _.cloneDeep(history)]
        },
        this.history
      )
      setLogger(_.clone(this.log))
      setHistory(_.cloneDeep(this.history))
      return res
    }
  }

  console.log(switchComand?.history)
  const gg = new GulyayGorod()
  const unitData: {
    name: UnitName
    image: string
    unit: (IUnitInter & ISpecialAbility) | IUnitInter
  }[] = [
    {
      name: "Варвар",
      image: "Barbarian_info.webp",
      unit: new HeavyIntantry(),
    },
    {
      name: "Гоблин",
      image: "Goblin_info.webp",
      unit: new LightIntantry(),
    },
    {
      name: "Лучница",
      image: "Archer_info.webp",
      unit: new Archer(),
    },
    {
      name: "Целительница",
      image: "Healer_info.webp",
      unit: new Healer(),
    },
    {
      name: "Колдун",
      image: "Wizard_info.webp",
      unit: new Warlock(),
    },
    {
      name: "П.Е.К.К.А",
      image: "P.E.K.K.A_info.webp",
      unit: new Knight(),
    },
    {
      name: "Гуляй-город",
      image: "Wall1.webp",
      unit: new GulyayGorodAdapter(gg),
    },
  ]

  return (
    <>
      <div className="wrapper">
        <header className="header">
          <div className="container">
            <h1>Смертельная битва</h1>
          </div>
        </header>
        <div className="container">
          {battle && switchComand ? (
            <>
              <div className="controlls">
                <button
                  onClick={() => {
                    const proxy = new BattleProxy(battle)
                    const action = new GoBack(proxy)
                    setBattle(
                      _.cloneDeep(
                        switchComand.switchExecute(action, (move: number) => {
                          setActiveMove(move)
                        })
                      )
                    )
                  }}
                  disabled={isDraw || activeMove === 1}
                >
                  Назад
                </button>
                <button
                  onClick={() => {
                    const proxy = new BattleProxy(battle)
                    const action = new GoForward(proxy)
                    setBattle(
                      _.cloneDeep(
                        switchComand.switchExecute(action, (move: number) => {
                          setActiveMove(move)
                        })
                      )
                    )
                  }}
                  disabled={
                    isDraw ||
                    !battle.blueArmy.length ||
                    !battle.redArmy.length ||
                    activeMove === history.length
                  }
                >
                  Вперед
                </button>
                <button
                  onClick={() => {
                    const proxy = new BattleProxy(battle)
                    const action = new MakeMove(proxy)
                    setBattle(
                      _.cloneDeep(
                        switchComand.switchExecute(action, (move: number) => {
                          setActiveMove(move)
                        })
                      )
                    )
                  }}
                  disabled={
                    isDraw ||
                    !battle.blueArmy.length ||
                    !battle.redArmy.length ||
                    activeMove !== history.length
                  }
                >
                  Атаковать
                </button>
                <button
                  onClick={() => {
                    const proxy = new BattleProxy(battle)
                    const action = new MakeFight(proxy)
                    setBattle(
                      _.cloneDeep(
                        switchComand.switchExecute(action, (move: number) => {
                          setActiveMove(move)
                        })
                      )
                    )
                  }}
                  disabled={
                    isDraw ||
                    !battle.blueArmy.length ||
                    !battle.redArmy.length ||
                    activeMove !== history.length
                  }
                >
                  До победы
                </button>
                <button
                  onClick={() => {
                    setBattle(null)
                    setHistory([])
                    setSwitchComand(null)
                    setIsDraw(false)
                    setLogger([])
                    setActiveMove(1)
                  }}
                >
                  Выйти в главное меню
                </button>
              </div>
              {!battle.redArmy.length && (
                <div className="result blue">
                  Победа команды <span>синих!</span>
                </div>
              )}
              {!battle.blueArmy.length && (
                <div className="result red">
                  Победа команды <span>красных!</span>
                </div>
              )}
              {isDraw && <div className="result">К сожалению у вас ничья</div>}
              <div className="battle_wrapper">
                <div className="team">
                  <h3 className="team_name blue">
                    Команда <span>синих</span>
                  </h3>
                  {battle.blueArmy.map((el, index) => (
                    <div className="battle_unit" key={el.UnitName + index}>
                      <div className="battle_unit_name">{el.UnitName}</div>
                      <div className="battle_unit_skills">
                        <div className="battle_unit_skill">
                          <img src="like.png" alt="heart" />
                          {el.HitPoints.toFixed(2)}
                        </div>
                        <div className="battle_unit_skill">
                          <img src="sword.png" alt="heart" />
                          {el.Attack}
                        </div>
                        <div className="battle_unit_skill">
                          <img src="shield.png" alt="heart" />
                          {el.Defense}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="middle">
                  <div className="move">Ход: {activeMove}</div>
                  {logger.length ? (
                    <div className="loggs_wrapper">
                      <div className="loggs">
                        {logger.map((el) => (
                          <div>{el}</div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="team">
                  <h3 className="team_name red">
                    Команда <span>красных</span>
                  </h3>
                  {battle.redArmy.map((el, index) => (
                    <div className="battle_unit" key={el.UnitName + index}>
                      <div className="battle_unit_name">{el.UnitName}</div>
                      <div className="battle_unit_skills">
                        <div className="battle_unit_skill">
                          <img src="like.png" alt="heart" />
                          {el.HitPoints.toFixed(2)}
                        </div>
                        <div className="battle_unit_skill">
                          <img src="sword.png" alt="heart" />
                          {el.Attack}
                        </div>
                        <div className="battle_unit_skill">
                          <img src="shield.png" alt="heart" />
                          {el.Defense}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="info">
                <h2 className="title">Команда: Джаваскриптизеры</h2>
                <div className="students">
                  <div className="student">Сергей Бодров</div>
                  <div className="student">Максим Шкураток</div>
                  <div className="student">Джоэл Касиси</div>
                </div>
              </div>
              <h2 className="title">Выберите юнитов для битвы</h2>
              <div className="units">
                {unitData.map((el) => (
                  <div className="unit" key={el.name}>
                    <div className="image">
                      <img src={el.image} alt={el.name} />
                    </div>
                    <div className="name">{el.name}</div>
                    <div className="skills">Здоровье: {el.unit.HitPoints}</div>
                    <div className="skills">Атака: {el.unit.Attack}</div>
                    <div className="skills">Защита: {el.unit.Defense}</div>
                    {isISpecialAbility(el.unit) ? (
                      <div className="skills">Имеет секретную способность</div>
                    ) : (
                      <div className="skills"></div>
                    )}
                    <div className="skills">
                      Цена:{" "}
                      {el.unit.Attack +
                        el.unit.Defense +
                        el.unit.HitPoints +
                        (isISpecialAbility(el.unit)
                          ? (el.unit.Range + el.unit.Strangth) * 2
                          : 0)}
                    </div>

                    <div className="input">
                      <input
                        type="checkbox"
                        disabled={
                          activeUnits.includes(el.name) &&
                          activeUnits.length === 1
                        }
                        checked={activeUnits.includes(el.name)}
                        onClick={() => {
                          if (activeUnits.includes(el.name)) {
                            setActiveUnits(
                              activeUnits.filter((unit) => unit !== el.name)
                            )
                          } else {
                            setActiveUnits([...activeUnits, el.name])
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="controlls">
                <button
                  onClick={() => {
                    const battle = new Battle()
                    setBattle(battle)
                    setHistory([battle])
                    setSwitchComand(new Switch(battle))
                  }}
                >
                  Создать битву
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default App
