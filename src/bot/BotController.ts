import config from '../config';
import logger from '../logger';
import { CommandoClient } from 'discord.js-commando';
import { Guild, GuildMember } from 'discord.js';
import { Commands } from './commands';
import createGuild from '../utils/createGuild';
import { getInitialRole } from '../utils/getInitialRole';
import { rebind } from '../utils/rebind';

export class BotController {
  public client = new CommandoClient({
    commandPrefix: config.general.commandPrefix,
    owner: config.general.ownerId,
  });

  public connect = (): void => {
    this.client.registry
      .registerDefaultTypes()
      .registerGroups([['admin', 'Admin Commands']])
      .registerDefaultGroups()
      .registerDefaultCommands({
        eval: false,
        commandState: false,
        ping: false,
        prefix: false,
      })
      .registerCommands(Commands);

    this.client.login(config.general.botToken);

    this.client.on('guildCreate', async guild => {
      console.log(`Creating guild: ${guild.id}`);
      await createGuild({ guildId: guild.id });

    });

    this.client.on('guildMemberAdd', async (member: GuildMember) => {
      // Add initial role to new members if it exists
      console.log('guildMemberAdd triggered')
      const initialRole = await getInitialRole({ guildId: member.guild.id });
      const user = member.guild.member(member.id);

      if (initialRole && user) {
        console.log(`Granting role ${initialRole} to ${user}`);
        user.roles.add(initialRole);
      }
    });

    this.client.on('ready', () => {
      logger.info('Welcome to Rule Meister');
      logger.info('Connected to Discord');

      if (this.client.user) {
        this.client.user.setUsername(config.general.botUsername);
        this.client.user.setPresence({
          activity: { name: '?rules help' },
        });
      }

      const guilds = this.client.guilds.cache.map((guild: Guild) => guild);

      guilds.forEach(async (guild: Guild) => {
        rebind({ guild: guild });
      });
    });

    this.client.on('error', (error: { message: any }) => {
      logger.error(`Something went wrong. Reason: ${error.message}`);
    });
  };
}

export const bot = new BotController();

export default BotController;