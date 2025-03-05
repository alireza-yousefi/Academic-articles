// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['@/public/css/main.css',"@/public/css/font.css"],
  app: {
    baseURL: '/Academic-articles/', // نام ریپازیتوری شما
    buildAssetsDir: '/-assets/', // مسیر ساخت فایل‌های استاتیک
  },
  ssr: false, // پروژه بدون SSR اجرا می‌شود
  modules: ['@nuxtjs/tailwindcss'],

});
