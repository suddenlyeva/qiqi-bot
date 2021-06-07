const Discord = require('discord.js');
const client = new Discord.Client();
const disbut = require('discord-buttons');
const config = require('./config.js');
disbut(client);
let mod_channel;
let guild;
let member_role;

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./localStorage');
}

client.on('ready', async () => {
  mod_channel = await client.channels.cache.get(config.mod_channel_id)
  guild = await client.guilds.fetch(config.guild_id)
  member_role = await guild.roles.fetch(config.member_role_id)
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {

  if (msg.author.bot) {
    return;
  }

  if (msg.content === '~ping') {
    msg.reply('Pong!');
  }

  if (msg.channel.type == 'dm') {

    if (localStorage.getItem(msg.author.id + ':status') == null) {

      const accept_button = new disbut.MessageButton()
        .setLabel('Accept')
        .setStyle('green')
        .setID('accept_button')
  
      const deny_button = new disbut.MessageButton()
        .setLabel('Deny')
        .setStyle('red')
        .setID('deny_button')
  
      const row = new disbut.MessageActionRow()
        .addComponent(accept_button)
        .addComponent(deny_button);
  
      const embed = new Discord.MessageEmbed()
        .setAuthor(msg.author.tag + ' requested verification:', msg.author.avatarURL())
        .setColor(0xf2da80)
        .setDescription(msg.content)
        .addField('User Info:','<@' + msg.author.id + '>')
        .setFooter('Pending')
        .setTimestamp();
  
      const request = await mod_channel.send('', {
        component: row,
        embed
      })

      localStorage.setItem(msg.author.id + ':status', 'PENDING')
      localStorage.setItem(msg.author.id + ':request_id', request.id)

    }
    else if (localStorage.getItem(msg.author.id + ':status') === 'PENDING') {
      const existing_request_id = localStorage.getItem(msg.author.id + ':request_id')
      const existing_request = await mod_channel.messages.fetch(existing_request_id)

      const old_embed = existing_request.embeds[0]

      const new_embed = old_embed
        .setDescription(old_embed.description + '\n-----\n' + msg.content)
        .setTimestamp()

      existing_request.edit('', {
        component: existing_request.components[0],
        embed: new_embed
      })
    }
  }
});

client.on('clickButton', async (button) => {
  if (button.id === 'accept_button') {

    const old_embed = button.message.embeds[0]

    const requester_tag = old_embed.fields[0].value
    const requester_id = requester_tag.slice(2,-1)

    const requester = await guild.members.fetch(requester_id)
    await requester.roles.add(member_role)

    const reply_embed = new Discord.MessageEmbed()
      .setColor(0x59e665)
      .setTitle('You have been granted access to the server!')
      .addField(config.accept_title, config.accept_value)
      .setThumbnail(config.accept_img)
      .setTimestamp();
  
    await client.users.cache.get(requester_id).send(reply_embed);

    const new_embed = old_embed
      .setColor(0x59e665)
      .setFooter('Accepted by ' + button.clicker.user.tag)
      .setTimestamp();

    await button.message.edit(new_embed)
    await button.defer(true)

    localStorage.setItem(requester_id + ':status', 'ACCEPTED')
  }
});

client.on('clickButton', async (button) => {
  if (button.id === 'deny_button') {

    const old_embed = button.message.embeds[0]

    const requester_tag = old_embed.fields[0].value
    const requester_id = requester_tag.slice(2,-1)

    const reply_embed = new Discord.MessageEmbed()
      .setColor(0xee484d)
      .setTitle('You have been denied access to the server.')
      .addField(config.deny_title, config.deny_value)
      .setThumbnail(config.deny_img)
      .setTimestamp();

    await client.users.cache.get(requester_id).send(reply_embed);

    const new_embed = old_embed
      .setColor(0xee484d)
      .setFooter('Denied by ' + button.clicker.user.tag)
      .setTimestamp();

    await button.message.edit(new_embed)
    await button.defer(true)

    localStorage.setItem(requester_id + ':status', 'DENIED')
  }
});

client.login(config.auth_token);