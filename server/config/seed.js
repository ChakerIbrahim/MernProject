/**
 * seed.js
 * Script to create or update the initial system administrator account.
 * Run manually via CLI; not imported by the running application.
 */
require('dotenv').config({ path: '../server.env' });
const mongoose = require('mongoose');
const User = require('../models/user.model');

mongoose.connect(process.env.MONGOOSE_URI)
    .then(async () => {
        console.log('Connected to DB for seeding');

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
            process.exit(1);
        }

        let admin = await User.findOne({ email: adminEmail }).select('+password');
        if (!admin) {
            admin = new User({
                name: 'System Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                status: 'approved'
            });
        } else {
            admin.name = 'System Admin';
            admin.password = adminPassword;
            admin.role = 'admin';
            admin.status = 'approved';
        }

        await admin.save();
        console.log('Admin seeded successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
