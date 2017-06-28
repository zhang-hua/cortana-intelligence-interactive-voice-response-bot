# Enabling Skype Calling

Calls are not automatically enabled for the Skype Channel. Before you can talk to your bot, you must enable this feature.

1. Navigate to the [Bot Portal][1] and click your your bot's name.
1. Click your your bot's name.  
![screenshot][IMG1]
1. Edit the bot's `Skype Configuration`
![screenshot][IMG2]
1. Find the option for `1:1 audio calls` and enable it, using your bot's `calling webhook`.  
![screenshot][IMG3]
1. Save the configuration.  
> Your bot's calling webhook is `https://YOUR_WEB_APP.azurewebsites.net/api/calls`

[1]: https://dev.botframework.com/bots
[IMG1]: ./img/skype-channel-01.png
[IMG2]: ./img/skype-channel-02.png
[IMG3]: ./img/skype-channel-03.png