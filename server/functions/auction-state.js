const { sendEmail } = require('../services/email.service');
const User = require('../models/user.model');

const resolveAuctionState = async (auction) => {
    if (!auction) return null;
    if (auction.status === 'active' && new Date(auction.endsAt) <= new Date()) {
        auction.status = 'ended';
        await auction.save();

        try {
            // Fetch owner details
            const owner = await User.findById(auction.createdBy);

            if (auction.currentHighestBidder) {
                // Fetch winner details
                const winner = await User.findById(auction.currentHighestBidder);

                // Notify Winner
                if (winner && winner.email) {
                    await sendEmail({
                        templateType: 'GENERAL',
                        to_email: winner.email,
                        to_name: winner.name,
                        subject: 'تهانينا! لقد فزت بالمزاد',
                        email_title: 'إشعار فوز بمزاد',
                        intro_text: `لقد فزت بالمزاد "${auction.title}" كأعلى مزايد بسعر ${auction.currentPrice} ₪.`,
                        details: 'يرجى تسجيل الدخول إلى المنصة والانتقال إلى صفحة المزاد لإتمام إجراءات الدفع والتواصل مع الجهة الطارحة.'
                    });
                }

                // Notify Owner
                if (owner && owner.email) {
                    await sendEmail({
                        templateType: 'GENERAL',
                        to_email: owner.email,
                        to_name: owner.companyName || owner.name,
                        subject: 'انتهاء المزاد بنجاح',
                        email_title: 'إشعار انتهاء مزاد',
                        intro_text: `لقد انتهى المزاد "${auction.title}" وتمت ترسيته.`,
                        details: `المزايد الأعلى هو ${winner ? winner.name : 'مستخدم'} بسعر ${auction.currentPrice} ₪. يرجى تسجيل الدخول لمتابعة الإجراءات.`
                    });
                }
            } else {
                // Notify Owner (No bids)
                if (owner && owner.email) {
                    await sendEmail({
                        templateType: 'GENERAL',
                        to_email: owner.email,
                        to_name: owner.companyName || owner.name,
                        subject: 'انتهاء المزاد دون مزايدات',
                        email_title: 'إشعار انتهاء مزاد',
                        intro_text: `لقد انتهى المزاد "${auction.title}" دون تسجيل أي مزايدات.`,
                        details: 'يمكنك مراجعة المزاد في لوحة التحكم واتخاذ الإجراء المناسب (مثل إعادة طرحه).'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to send auction end notifications:', error);
        }
    }
    return auction;
};

module.exports = { resolveAuctionState };
