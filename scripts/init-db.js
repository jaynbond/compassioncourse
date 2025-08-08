const mongoose = require('mongoose');
const User = require('../models/User');
const Content = require('../models/Content');
require('dotenv').config();

async function initializeDatabase() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/compassion-course', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to MongoDB');

        // Create admin user if not exists
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@compassioncourse.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const admin = new User({
                name: 'Admin User',
                email: adminEmail,
                password: adminPassword,
                role: 'super-admin'
            });

            await admin.save();
            console.log('✅ Admin user created');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
            console.log('   ⚠️  Please change the admin password after first login!');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Initialize default content
        const defaultContent = [
            {
                key: 'hero-title',
                title: 'Hero Section Title',
                content: 'Discover The Compassion Course',
                section: 'hero',
                order: 1
            },
            {
                key: 'hero-subtitle',
                title: 'Hero Section Subtitle',
                content: 'Changing lives in over 120 Countries',
                section: 'hero',
                order: 2
            },
            {
                key: 'hero-description',
                title: 'Hero Section Description',
                content: 'The Compassion Course empowers you to live in alignment with your values, be heard and understood and create meaningful dialogues by understanding human needs, breaking free from judgment and criticism and navigate disagreements with "needs awareness"',
                section: 'hero',
                order: 3
            },
            {
                key: 'about-title',
                title: 'About Section Title',
                content: 'About the Compassion Course',
                section: 'about',
                order: 1
            },
            {
                key: 'about-description',
                title: 'About Section Description',
                content: 'Changing Lives for 14 Years, with more than 30,000 Participants, in over 120 Countries, in 20 Languages.',
                section: 'about',
                order: 2
            },
            {
                key: 'stats-participants',
                title: 'Participants Statistics',
                content: '30,000+',
                section: 'statistics',
                order: 1
            },
            {
                key: 'stats-countries',
                title: 'Countries Statistics',
                content: '120+',
                section: 'statistics',
                order: 2
            },
            {
                key: 'programs-title',
                title: 'Programs Section Title',
                content: 'After The Compassion Course - A World of Possibilities',
                section: 'programs',
                order: 1
            },
            {
                key: 'testimonials-title',
                title: 'Testimonials Section Title',
                content: 'What People Say',
                section: 'testimonials',
                order: 1
            },
            {
                key: 'cta-title',
                title: 'Call to Action Title',
                content: 'Ready to Transform Your Life?',
                section: 'cta',
                order: 1
            },
            {
                key: 'cta-description',
                title: 'Call to Action Description',
                content: 'Join thousands of others who have discovered their potential through the Compassion Course.',
                section: 'cta',
                order: 2
            }
        ];

        for (const contentData of defaultContent) {
            const existing = await Content.findOne({ key: contentData.key });
            if (!existing) {
                const content = new Content(contentData);
                await content.save();
                console.log(`✅ Created content: ${contentData.key}`);
            }
        }

        console.log('✅ Database initialization completed successfully!');
        console.log('\n🚀 Next steps:');
        console.log('1. Start the server: npm start');
        console.log('2. Visit http://localhost:3000 to see your website');
        console.log('3. Visit http://localhost:3000/admin to access the admin panel');
        console.log(`4. Login with: ${adminEmail} / ${adminPassword}`);
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run initialization
initializeDatabase();
