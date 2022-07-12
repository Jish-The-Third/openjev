 const { Vec3 } = require('vec3')
const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const GoalFollow = goals.GoalFollow
const GoalBlock = goals.GoalBlock
const pvp = require('mineflayer-pvp').plugin

// READ THE COMMENTS BEFORE STARTING THE PROGRAM. THE BOT WILL NOT WORK WITHOUT THE INFOMRATION BEING FILLED IN!!!!!

  const bot = mineflayer.createBot({
    host: '', // This is the ip address, or hostname, of your server, an example of this would be Jevalent.aternos.me (it's our demo server). If you leave this blank the bot won't do anything
    port: '', // This is all the numbers after the server's colon. An example would be Jevalent.aternos.me:28047 would be just 28047
    username: '' || 'OpenJev', // minecraft username, only leave blank for some servers that are 'offline'
    password: '', // Only use this if your going to have an account with that the bot is controlling!!!
    auth: '' // If you usinga microsoft account, set this to 'microsoft'
  })

bot.loadPlugin(pathfinder)

function followPlayer() {
  const entity = bot.nearestEntity()
    const player = bot.players[entity]

    if (!player || !player.entity) {
        bot.chat("I can't see anyone!")
        return
    }

    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.scafoldingBlocks = []

    bot.pathfinder.setMovements(movements)

    const goal = new GoalFollow(player.entity, 1)
    bot.pathfinder.setGoal(goal, true)
}

function locatereturnblock () {
    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.scafoldingBlocks = []
    bot.pathfinder.setMovements(movements)

    const returnBlock = bot.findBlock({
        matching: mcData.blocksByName.blue_wool.id,
        maxDistance: 70
    })

    if (!returnBlock) {
        bot.chat("I can't see a return block!")
        return
    }

    const x = returnBlock.position.x
    const y = returnBlock.position.y + 1
    const z = returnBlock.position.z
    const goal = new GoalBlock(x, y, z)
    bot.pathfinder.setGoal(goal)
}

function locateEmeraldBlock () {
  const mcData = require('minecraft-data')(bot.version)
  const movements = new Movements(bot, mcData)
  movements.scafoldingBlocks = []
  bot.pathfinder.setMovements(movements)

  const emeraldBlock = bot.findBlock({
      matching: mcData.blocksByName.emerald_block.id,
      maxDistance: 32
  })

  if (!emeraldBlock) {
      bot.chat("I can't see any emerald blocks!")
      return
  }

  const x = emeraldBlock.position.x
  const y = emeraldBlock.position.y + 1
  const z = emeraldBlock.position.z
  const goal = new GoalBlock(x, y, z)
  bot.pathfinder.setGoal(goal)
}

// WHERE THE CHAT STUFF GOES

bot.loadPlugin(pvp)

bot.once('chat', (username, message) => {
  const player = bot.players[username]
  if (message === 'locate') {
    locateEmeraldBlock()
  }
  if (message === 'follow') {
    followPlayer()
  }
  if (message === 'return') {
    locatereturnblock()
  }
})

bot.loadPlugin(collectBlock)

let mcData
bot.once('spawn', () => {
  mcData = require('minecraft-data')(bot.version)
})

bot.on('chat', async (username, message) => {
  const args = message.split(' ')
  if (args[0] !== 'collect') return

  const blockType = mcData.blocksByName[args[1]]
  if (!blockType) {
    bot.chat(`I don't know any blocks named ${args[1]}.`)
    return
  }

  const block = bot.findBlock({
    matching: blockType.id,
    maxDistance: 64
  })

  if (!block) {
    bot.chat("I don't see that block nearby.")
    return
  }

  const targets = bot.collectBlock.findFromVein(block)
  try {
    await bot.collectBlock.collect(targets)
    // All blocks have been collected.
    bot.chat('Done')
  } catch (err) {
    // An error occurred, report it.
    bot.chat(err.message)
    console.log(err)
  }
})

bot.on('chat', async (username, message) => {
  if (username === bot.username) return
  const command = message.split(' ')
  switch (true) {
    case message === 'loaded':
      await bot.waitForChunksToLoad()
      bot.chat('Ready!')
      break
    case /^list$/.test(message):
      sayItems()
      break
    case /^toss \d+ \w+$/.test(message):
      // toss amount name
      // ex: toss 64 diamond
      tossItem(command[2], command[1])
      break
    case /^toss \w+$/.test(message):
      // toss name
      // ex: toss diamond
      tossItem(command[1])
      break
    case /^equip [\w-]+ \w+$/.test(message):
      // equip destination name
      // ex: equip hand diamond
      equipItem(command[2], command[1])
      break
    case /^unequip \w+$/.test(message):
      // unequip testination
      // ex: unequip hand
      unequipItem(command[1])
      break
    case /^use$/.test(message):
      useEquippedItem()
      break
    case /^craft \d+ \w+$/.test(message):
      // craft amount item
      // ex: craft 64 stick
      craftItem(command[2], command[1])
      break
  }
})

function sayItems (items = null) {
  if (!items) {
    items = bot.inventory.items()
    if (require('minecraft-data')(bot.version).isNewerOrEqualTo('1.9') && bot.inventory.slots[45]) items.push(bot.inventory.slots[45])
  }
  const output = items.map(itemToString).join(', ')
  if (output) {
    bot.chat(output)
  } else {
    bot.chat('empty')
  }
}

async function tossItem (name, amount) {
  amount = parseInt(amount, 10)
  const item = itemByName(name)
  if (!item) {
    bot.chat(`I have no ${name}`)
  } else {
    try {
      if (amount) {
        await bot.toss(item.type, null, amount)
        bot.chat(`tossed ${amount} x ${name}`)
      } else {
        await bot.tossStack(item)
        bot.chat(`tossed ${name}`)
      }
    } catch (err) {
      bot.chat(`unable to toss: ${err.message}`)
    }
  }
}

async function equipItem (name, destination) {
  const item = itemByName(name)
  if (item) {
    try {
      await bot.equip(item, destination)
      bot.chat(`equipped ${name}`)
    } catch (err) {
      bot.chat(`cannot equip ${name}: ${err.message}`)
    }
  } else {
    bot.chat(`I have no ${name}`)
  }
}

async function unequipItem (destination) {
  try {
    await bot.unequip(destination)
    bot.chat('unequipped')
  } catch (err) {
    bot.chat(`cannot unequip: ${err.message}`)
  }
}

function useEquippedItem () {
  bot.chat('activating item')
  bot.activateItem()
}

async function craftItem (name, amount) {
  amount = parseInt(amount, 10)
  const mcData = require('minecraft-data')(bot.version)

  const item = mcData.itemsByName[name]
  const craftingTableID = mcData.blocksByName.crafting_table.id

  const craftingTable = bot.findBlock({
    matching: craftingTableID
  })

  if (item) {
    const recipe = bot.recipesFor(item.id, null, 1, craftingTable)[0]
    if (recipe) {
      bot.chat(`I can make ${name}`)
      try {
        await bot.craft(recipe, amount, craftingTable)
        bot.chat(`did the recipe for ${name} ${amount} times`)
      } catch (err) {
        bot.chat(`error making ${name}`)
      }
    } else {
      bot.chat(`I cannot make ${name}`)
    }
  } else {
    bot.chat(`unknown item: ${name}`)
  }
}

function itemToString (item) {
  if (item) {
    return `${item.name} x ${item.count}`
  } else {
    return '(nothing)'
  }
}

function itemByName (name) {
  const items = bot.inventory.items()
  if (require('minecraft-data')(bot.version).isNewerOrEqualTo('1.9') && bot.inventory.slots[45]) items.push(bot.inventory.slots[45])
  return items.filter(item => item.name === name)[0]
}

bot.loadPlugin(pvp)

bot.on('chat', (username, message) => {
  if (message === 'fight me') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.pvp.attack(player.entity)
  }

  if (message === 'stop') {
    bot.pvp.stop()
  }
})

bot.loadPlugin(pvp)

bot.on('hurt', (username, message) => {
  const entity = bot.nearestEntity()
  bot.pvp.attack(entity)
})

bot.on('experience', () => {
  bot.chat(`I am level ${bot.experience.level}`)
})

bot.on('chat', (username, message) => {
  if (username === bot.username) return
  switch (true) {
    case /^list$/.test(message):
      sayItems()
      break
    case /^chest$/.test(message):
      watchChest(false, ['chest', 'ender_chest', 'trapped_chest'])
      break
    case /^furnace$/.test(message):
      watchFurnace()
      break
    case /^dispenser$/.test(message):
      watchChest(false, ['dispenser'])
      break
    case /^enchant$/.test(message):
      watchEnchantmentTable()
      break
    case /^chestminecart$/.test(message):
      watchChest(true)
      break
    case /^invsee \w+( \d)?$/.test(message): {
      // invsee Herobrine [or]
      // invsee Herobrine 1
      const command = message.split(' ')
      useInvsee(command[0], command[1])
      break
    }
  }
})

function sayItems (items = bot.inventory.items()) {
  const output = items.map(itemToString).join(', ')
  if (output) {
    bot.chat(output)
  } else {
    bot.chat('empty')
  }
}

async function watchChest (minecart, blocks = []) {
  let chestToOpen
  if (minecart) {
    chestToOpen = Object.keys(bot.entities)
      .map(id => bot.entities[id]).find(e => e.entityType === mcData.entitiesByName.chest_minecart &&
      e.objectData.intField === 1 &&
      bot.entity.position.distanceTo(e.position) < 3)
    if (!chestToOpen) {
      bot.chat('no chest minecart found')
      return
    }
  } else {
    chestToOpen = bot.findBlock({
      matching: blocks.map(name => mcData.blocksByName[name].id),
      maxDistance: 6
    })
    if (!chestToOpen) {
      bot.chat('no chest found')
      return
    }
  }
  const chest = await bot.openContainer(chestToOpen)
  sayItems(chest.containerItems())
  chest.on('updateSlot', (slot, oldItem, newItem) => {
    bot.chat(`chest update: ${itemToString(oldItem)} -> ${itemToString(newItem)} (slot: ${slot})`)
  })
  chest.on('close', () => {
    bot.chat('chest closed')
  })

  bot.on('chat', onChat)

  function onChat (username, message) {
    if (username === bot.username) return
    const command = message.split(' ')
    switch (true) {
      case /^close$/.test(message):
        closeChest()
        break
      case /^withdraw \d+ \w+$/.test(message):
        // withdraw amount name
        // ex: withdraw 16 stick
        withdrawItem(command[2], command[1])
        break
      case /^deposit \d+ \w+$/.test(message):
        // deposit amount name
        // ex: deposit 16 stick
        depositItem(command[2], command[1])
        break
    }
  }

  function closeChest () {
    chest.close()
    bot.removeListener('chat', onChat)
  }

  async function withdrawItem (name, amount) {
    const item = itemByName(chest.containerItems(), name)
    if (item) {
      try {
        await chest.withdraw(item.type, null, amount)
        bot.chat(`withdrew ${amount} ${item.name}`)
      } catch (err) {
        bot.chat(`unable to withdraw ${amount} ${item.name}`)
      }
    } else {
      bot.chat(`unknown item ${name}`)
    }
  }

  async function depositItem (name, amount) {
    const item = itemByName(chest.items(), name)
    if (item) {
      try {
        await chest.deposit(item.type, null, amount)
        bot.chat(`deposited ${amount} ${item.name}`)
      } catch (err) {
        bot.chat(`unable to deposit ${amount} ${item.name}`)
      }
    } else {
      bot.chat(`unknown item ${name}`)
    }
  }
}

async function watchFurnace () {
  const furnaceBlock = bot.findBlock({
    matching: ['furnace', 'lit_furnace'].filter(name => mcData.blocksByName[name] !== undefined).map(name => mcData.blocksByName[name].id),
    maxDistance: 6
  })
  if (!furnaceBlock) {
    bot.chat('no furnace found')
    return
  }
  const furnace = await bot.openFurnace(furnaceBlock)
  let output = ''
  output += `input: ${itemToString(furnace.inputItem())}, `
  output += `fuel: ${itemToString(furnace.fuelItem())}, `
  output += `output: ${itemToString(furnace.outputItem())}`
  bot.chat(output)

  furnace.on('updateSlot', (slot, oldItem, newItem) => {
    bot.chat(`furnace update: ${itemToString(oldItem)} -> ${itemToString(newItem)} (slot: ${slot})`)
  })
  furnace.on('close', () => {
    bot.chat('furnace closed')
  })
  furnace.on('update', () => {
    console.log(`fuel: ${Math.round(furnace.fuel * 100)}% progress: ${Math.round(furnace.progress * 100)}%`)
  })

  bot.on('chat', onChat)

  function onChat (username, message) {
    if (username === bot.username) return
    const command = message.split(' ')
    switch (true) {
      case /^close$/.test(message):
        closeFurnace()
        break
      case /^(input|fuel) \d+ \w+$/.test(message):
        // input amount name
        // ex: input 32 coal
        putInFurnace(command[0], command[2], command[1])
        break
      case /^take (input|fuel|output)$/.test(message):
        // take what
        // ex: take output
        takeFromFurnace(command[0])
        break
    }

    function closeFurnace () {
      furnace.close()
      bot.removeListener('chat', onChat)
    }

    async function putInFurnace (where, name, amount) {
      const item = itemByName(furnace.items(), name)
      if (item) {
        const fn = {
          input: furnace.putInput,
          fuel: furnace.putFuel
        }[where]
        try {
          await fn.call(furnace, item.type, null, amount)
          bot.chat(`put ${amount} ${item.name}`)
        } catch (err) {
          bot.chat(`unable to put ${amount} ${item.name}`)
        }
      } else {
        bot.chat(`unknown item ${name}`)
      }
    }

    async function takeFromFurnace (what) {
      const fn = {
        input: furnace.takeInput,
        fuel: furnace.takeFuel,
        output: furnace.takeOutput
      }[what]
      try {
        const item = await fn.call(furnace)
        bot.chat(`took ${item.name}`)
      } catch (err) {
        bot.chat('unable to take')
      }
    }
  }
}

async function watchEnchantmentTable () {
  const enchantTableBlock = bot.findBlock({
    matching: ['enchanting_table'].map(name => mcData.blocksByName[name].id),
    maxDistance: 6
  })
  if (!enchantTableBlock) {
    bot.chat('no enchantment table found')
    return
  }
  const table = await bot.openEnchantmentTable(enchantTableBlock)
  bot.chat(itemToString(table.targetItem()))

  table.on('updateSlot', (slot, oldItem, newItem) => {
    bot.chat(`enchantment table update: ${itemToString(oldItem)} -> ${itemToString(newItem)} (slot: ${slot})`)
  })
  table.on('close', () => {
    bot.chat('enchantment table closed')
  })
  table.on('ready', () => {
    bot.chat(`ready to enchant. choices are ${table.enchantments.map(o => o.level).join(', ')}`)
  })

  bot.on('chat', onChat)

  function onChat (username, message) {
    if (username === bot.username) return
    const command = message.split(' ')
    switch (true) {
      case /^close$/.test(message):
        closeEnchantmentTable()
        break
      case /^put \w+$/.test(message):
        // put name
        // ex: put diamondsword
        putItem(command[1])
        break
      case /^add lapis$/.test(message):
        addLapis()
        break
      case /^enchant \d+$/.test(message):
        // enchant choice
        // ex: enchant 2
        enchantItem(command[1])
        break
      case /^take$/.test(message):
        takeEnchantedItem()
        break
    }

    function closeEnchantmentTable () {
      table.close()
    }

    async function putItem (name) {
      const item = itemByName(table.window.items(), name)
      if (item) {
        try {
          await table.putTargetItem(item)
          bot.chat(`I put ${itemToString(item)}`)
        } catch (err) {
          bot.chat(`error putting ${itemToString(item)}`)
        }
      } else {
        bot.chat(`unknown item ${name}`)
      }
    }

    async function addLapis () {
      const item = itemByType(table.window.items(), ['dye', 'purple_dye', 'lapis_lazuli'].filter(name => mcData.itemByName[name] !== undefined)
        .map(name => mcData.itemByName[name].id))
      if (item) {
        try {
          await table.putLapis(item)
          bot.chat(`I put ${itemToString(item)}`)
        } catch (err) {
          bot.chat(`error putting ${itemToString(item)}`)
        }
      } else {
        bot.chat("I don't have any lapis")
      }
    }

    async function enchantItem (choice) {
      choice = parseInt(choice, 10)
      try {
        const item = await table.enchant(choice)
        bot.chat(`enchanted ${itemToString(item)}`)
      } catch (err) {
        bot.chat('error enchanting')
      }
    }

    async function takeEnchantedItem () {
      try {
        const item = await table.takeTargetItem()
        bot.chat(`got ${itemToString(item)}`)
      } catch (err) {
        bot.chat('error getting item')
      }
    }
  }
}

function useInvsee (username, showEquipment) {
  bot.once('windowOpen', (window) => {
    const count = window.containerItems().length
    const what = showEquipment ? 'equipment' : 'inventory items'
    if (count) {
      bot.chat(`${username}'s ${what}:`)
      sayItems(window.containerItems())
    } else {
      bot.chat(`${username} has no ${what}`)
    }
  })
  if (showEquipment) {
    // any extra parameter triggers the easter egg
    // and shows the other player's equipment
    bot.chat(`/invsee ${username} 1`)
  } else {
    bot.chat(`/invsee ${username}`)
  }
}

function itemToString (item) {
  if (item) {
    return `${item.name} x ${item.count}`
  } else {
    return '(nothing)'
  }
}

function itemByType (items, type) {
  let item
  let i
  for (i = 0; i < items.length; ++i) {
    item = items[i]
    if (item && item.type === type) return item
  }
  return null
}

function itemByName (items, name) {
  let item
  let i
  for (i = 0; i < items.length; ++i) {
    item = items[i]
    if (item && item.name === name) return item
  }
  return null
}


let target = null

bot.on('chat', (username, message) => {
  if (username === bot.username) return
  let entity
  switch (message) {
    case 'forward':
      bot.setControlState('forward', true)
      break
    case 'back':
      bot.setControlState('back', true)
      break
    case 'left':
      bot.setControlState('left', true)
      break
    case 'right':
      bot.setControlState('right', true)
      break
    case 'sprint':
      bot.setControlState('sprint', true)
      break
    case 'stop':
      bot.clearControlStates()
      break
    case 'jump':
      bot.setControlState('jump', true)
      bot.setControlState('jump', false)
      break
    case 'jump a lot':
      bot.setControlState('jump', true)
      break
    case 'stop jumping':
      bot.setControlState('jump', false)
      break
    case 'attack':
      entity = bot.nearestEntity()
      if (entity) {
        bot.attack(entity, true)
      } else {
        bot.chat('no nearby entities')
      }
      break
    case 'dismount':
      bot.dismount()
      break
    case 'move vehicle forward':
      bot.moveVehicle(0.0, 1.0)
      break
    case 'move vehicle backward':
      bot.moveVehicle(0.0, -1.0)
      break
    case 'move vehicle left':
      bot.moveVehicle(1.0, 0.0)
      break
    case 'move vehicle right':
      bot.moveVehicle(-1.0, 0.0)
      break
    case 'tp':
      bot.entity.position.y += 10
      break
    case 'pos':
      bot.chat(bot.entity.position.toString())
      break
    case 'yp':
      bot.chat(`Yaw ${bot.entity.yaw}, pitch: ${bot.entity.pitch}`)
      break
  }
})

bot.on('mount', () => {
  bot.chat(`mounted ${bot.vehicle.objectType}`)
})

bot.on('dismount', (vehicle) => {
  bot.chat(`dismounted ${vehicle.objectType}`)
})

bot.on('spawn', () => {
  const mcData = require('minecraft-data')(bot.version) // You will know the version when the bot has spawned
  const totemId = mcData.itemsByName.totem_of_undying.id // Get the correct id
  if (mcData.itemsByName.totem_of_undying) {
    setInterval(() => {
      const totem = bot.inventory.findInventoryItem(totemId, null)
      if (totem) {
        bot.equip(totem, 'off-hand')
      }
    }, 50)
  }
})

bot.on('inject_allowed', () => {
  mcData = require('minecraft-data')(bot.version)

})
// To fish we have to give bot the seeds
// /give farmer wheat_seeds 64

function blockToSow () {
  return bot.findBlock({
    point: bot.entity.position,
    matching: mcData.blocksByName.farmland.id,
    maxDistance: 6,
    useExtraInfo: (block) => {
      const blockAbove = bot.blockAt(block.position.offset(0, 1, 0))
      return !blockAbove || blockAbove.type === 0
    }
  })
}

function blockToHarvest () {
  return bot.findBlock({
    point: bot.entity.position,
    maxDistance: 6,
    matching: (block) => {
      return block && block.type === mcData.blocksByName.wheat.id && block.metadata === 7
    }
  })
}

async function loop () {
  try {
    while (1) {
      const toHarvest = blockToHarvest()
      if (toHarvest) {
        await bot.dig(toHarvest)
      } else {
        break
      }
    }
    while (1) {
      const toSow = blockToSow()
      if (toSow) {
        await bot.equip(mcData.itemsByName.wheat_seeds.id, 'hand')
        await bot.placeBlock(toSow, new Vec3(0, 1, 0))
      } else {
        break
      }
    }
  } catch (e) {
    console.log(e)
  }

  // No block to harvest or sow. Postpone next loop a bit
  setTimeout(loop, 1000)
}

bot.once('login', loop)

bot.on('chat', (username, message) => {
  if (username === bot.username) return
  switch (message) {
    case 'sleep':
      goToSleep()
      break
    case 'wakeup':
      wakeUp()
      break
  }
})

bot.on('sleep', () => {
  bot.chat('Good night!')
})
bot.on('wake', () => {
  bot.chat('Good morning!')
})

async function goToSleep () {
  const bed = bot.findBlock({
    matching: block => bot.isABed(block)
  })
  if (bed) {
    try {
      await bot.sleep(bed)
      bot.chat("I'm sleeping")
    } catch (err) {
      bot.chat(`I can't sleep: ${err.message}`)
    }
  } else {
    bot.chat('No nearby bed')
  }
}

async function wakeUp () {
  try {
    await bot.wake()
  } catch (err) {
    bot.chat(`I can't wake up: ${err.message}`)
  }
}

setInterval(() => {
  bot.setControlState('jump', true)
}, 100000)

// Log errors and kick reasons:
bot.on('kicked', console.log)
bot.on('error', console.log)
