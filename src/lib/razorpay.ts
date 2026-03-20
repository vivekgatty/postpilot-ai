import Razorpay from 'razorpay'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export const RAZORPAY_PLAN_IDS: Record<string, string> = {
  pro_monthly: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID ?? '',
  pro_yearly: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID ?? '',
  team_monthly: process.env.RAZORPAY_TEAM_MONTHLY_PLAN_ID ?? '',
  team_yearly: process.env.RAZORPAY_TEAM_YEARLY_PLAN_ID ?? '',
}
