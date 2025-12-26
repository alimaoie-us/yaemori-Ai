import { promises } from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'
import { xpRange } from '../lib/levelling.js'

let tags = {
  'main': 'القائمة - معلومات',
  'buscador': 'القائمة - بحث',
  'fun': 'القائمة - ألعاب',
  'gacha': 'القائمة - غاشا',
  'serbot': 'القائمة - بوتات',
  'rpg': 'القائمة - RPG',
  'rg': 'القائمة - تسجيل',
  'xp': 'القائمة - خبرة',
  'sticker': 'القائمة - ملصقات',
  'anime': 'القائمة - أنمي',
  'database': 'القائمة - قاعدة بيانات',
  'fix': 'القائمة - رسائل ثابتة',
  'grupo': 'القائمة - مجموعات',
  'nable': 'القائمة - تشغيل/إيقاف', 
  'descargas': 'القائمة - تحميلات',
  'tools': 'القائمة - أدوات',
  'info': 'القائمة - معلومات',
  'nsfw': 'القائمة - NSFW', 
  'owner': 'القائمة - المالك', 
  'audio': 'القائمة - صوتيات', 
  'ai': 'القائمة - ذكاء اصطناعي',
  'transformador': 'القائمة - محولات',
}

const defaultMenu = {
  before: `© القائمة الرسمية للبوت ☁️

*•/• معلومات المستخدم •/•*

🌸 المستخدم » \`\`\`%name\`\`\`
✨️ الخبرة » \`\`\`%exp\`\`\`
🍪 الكوكيز » \`\`\`%cookies\`\`\`
🛡 المستوى » \`\`\`%level\`\`\`
💫 الرتبة » \`\`\`%role\`\`\`

*•/• معلومات البوت •/•*

👑 صانع البوت » \`\`\`@DevDiego\`\`\`
🚩 البوت » \`\`\`%botofc\`\`\`
📆 التاريخ » \`\`\`%fecha\`\`\`
🕖 وقت التشغيل » \`\`\`%muptime\`\`\`
👤 المستخدمون » \`\`\`%totalreg\`\`\`

\t*قائمة الأوامر* 
`.trimStart(),
    header: '*•/• %category •/•*\n',
  body: '✰ %cmd',
  footer: '',
  after: `> ${dev}`,
}

let handler = async (m, { conn, usedPrefix: _p, __dirname }) => {
  try {
    let _package = JSON.parse(await promises.readFile(join(__dirname, '../package.json')).catch(_ => ({}))) || {}
    let { exp, cookies, level, role } = global.db.data.users[m.sender]
    let { min, xp, max } = xpRange(level, global.multiplier)
    let name = await conn.getName(m.sender)
    let d = new Date(new Date + 3600000)
    let locale = 'ar'
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    let time = d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })
    let _uptime = process.uptime() * 1000
    let uptime = clockString(_uptime)
    let totalreg = Object.keys(global.db.data.users).length
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        cookies: plugin.cookies,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }
    })
    for (let plugin of help)
      if (plugin && 'tags' in plugin)
        for (let tag of plugin.tags)
          if (!(tag in tags) && tag) tags[tag] = tag

    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || (conn.user.jid == conn.user.jid ? '' : `Powered by https://wa.me/${conn.user.jid.split`@`[0]}`) + defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                .replace(/%isdiamond/g, menu.diamond ? '(ⓓ)' : '')
                .replace(/%isPremium/g, menu.premium ? '(Ⓟ)' : '')
                .trim()
            }).join('\n')
          }),
          footer
        ].join('\n')
      }),
      after
    ].join('\n')

    let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
    let replace = {
      '%': '%',
      p: _p, uptime,
      me: conn.getName(conn.user.jid),
      taguser: '@' + m.sender.split("@s.whatsapp.net")[0],
      npmname: _package.name,
      npmdesc: _package.description,
      version: _package.version,
      exp: exp - min,
      maxexp: xp,
      botofc: (conn.user.jid == global.conn.user.jid ? 'رسمي' : 'بوت فرعي'), 
      fecha: new Date().toLocaleDateString('ar'), 
      totalexp: exp,
      xp4levelup: max - exp,
      greeting, level, cookies, name, week, date, time, totalreg, role,
      readmore: readMore
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])

    const response = await fetch(global.vid)
    const gif = await response.buffer()

    const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    const pp = await conn.profilePictureUrl(who, 'image').catch(_ => 'https://raw.githubusercontent.com/Alismbot/NATALY/refs/heads/main/elaina.jpg')

    await m.react('⭐️')
    await conn.sendMessage(m.chat, { video: { url: vid }, caption: text.trim(), contextInfo: { mentionedJid: [m.sender], isForwarded: true } }, { quoted: m })
  } catch (e) {
    await m.react('⚠️')
    conn.reply(m.chat, 'حدث خطأ أثناء إرسال القائمة', m)
    throw e
  }
}
handler.help = ['قائمة']
handler.tags = ['main']
handler.command = [ 'menu2']
handler.register = true

export default handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

  var ase = new Date();
var hour = ase.getHours();

switch(hour){
  case 0: hour = 'مساء الخير 🌙'; break;
  case 1: hour = 'مساء الخير 💤'; break;
  case 2: hour = 'مساء الخير 🦉'; break;
  case 3: hour = 'صباح الخير ✨'; break;
  case 4: hour = 'صباح الخير 💫'; break;
  case 5: hour = 'صباح الخير 🌅'; break;
  case 6: hour = 'صباح الخير 🌄'; break;
  case 7: hour = 'صباح الخير 🌅'; break;
  case 8: hour = 'صباح الخير 💫'; break;
  case 9: hour = 'صباح الخير ✨'; break;
  case 10: hour = 'صباح الخير 🌞'; break;
  case 11: hour = 'صباح الخير 🌨'; break;
  case 12: hour = 'صباح الخير ❄'; break;
  case 13: hour = 'مساء الخير 🌤'; break;
  case 14: hour = 'مساء الخير 🌇'; break;
  case 15: hour = 'مساء الخير 🥀'; break;
  case 16: hour = 'مساء الخير 🌹'; break;
  case 17: hour = 'مساء الخير 🌆'; break;
  case 18: hour = 'مساء الخير 🌙'; break;
  case 19: hour = 'مساء الخير 🌃'; break;
  case 20: hour = 'مساء الخير 🌌'; break;
  case 21: hour = 'مساء الخير 🌃'; break;
  case 22: hour = 'مساء الخير 🌙'; break;
  case 23: hour = 'مساء الخير 🌃'; break;
}

var greeting = hour;