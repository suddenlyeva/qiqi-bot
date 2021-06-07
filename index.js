const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.js');

let mod_channel;

client.on('ready', () => {
  mod_channel = client.channels.cache.get(config.mod_channel_id)
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === '~ping') {
    msg.reply('Pong!');
  }
});

client.on('message', msg => {
  if (msg.channel.type == "dm") {

    const embed = new Discord.MessageEmbed()
      .setAuthor(msg.author.username + ' requested verification:', msg.author.avatarURL())
      .setColor(0xf2da80)
      .setDescription(msg.content)
      .addField('User Info:','<@' + msg.author.id + '>')
      .setTimestamp();

    mod_channel.send(embed);
    return;
  }
});

client.login(config.auth_token);