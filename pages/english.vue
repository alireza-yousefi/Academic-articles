<template>
    <div class="flex flex-col w-full p-5 Estedad_FD_Light" style="direction: rtl;">
      <div class="flex text-center justify-between mx-28 mt-10">
        <!-- انتخاب فایل مقالات -->
        <div class="text-center">
          <label for="file1-upload" class="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300">
            انتخاب فایل مقالات
          </label>
          <input id="file1-upload" class="hidden" type="file" @change="handleFileUpload1" accept=".xlsx, .xls" />
          <p class="text-gray-600 mt-2 pt-3" v-if="!file1">هیچ فایلی انتخاب نشده است</p>
          <p class="text-gray-600 mt-2 pt-3" v-else>فایل انتخاب شده: {{ file1.name }}</p>
        </div>
  
        <!-- انتخاب فایل MIF -->
        <div class="text-center">
          <label for="file2-upload" class="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300">
            انتخاب فایل MIF
          </label>
          <input id="file2-upload" class="hidden" type="file" @change="handleFileUpload2" accept=".xlsx, .xls" />
          <p class="text-gray-600 mt-2 pt-3" v-if="!file2">هیچ فایلی انتخاب نشده است</p>
          <p class="text-gray-600 mt-2 pt-3" v-else>فایل انتخاب شده: {{ file2.name }}</p>
        </div>
      </div>
  
      <!-- بخش جستجو -->
      <div class="flex justify-center items-center mt-5">
        <input
          v-model="searchText"
          type="text"
          placeholder="جستجو (مثلاً نام یا مبلغ)"
          class="border rounded py-2 px-3 w-64"
        />
        <button @click="performSearch" class="bg-green-500 ml-1 text-white py-2 px-4 rounded-lg mr-2">
          جستجو
        </button>
        <button @click="resetSearch" class="bg-gray-500 text-white py-2 px-4 rounded-lg">
          حذف جستجو
        </button>
      </div>
  
      <!-- نمایش داده‌های فیلتر شده -->
      <div
        v-for="(item, i) in filteredData"
        :key="`data_${i}`"
        class="my-2 bg-slate-200 flex flex-col justify-center items-center border border-slate-700 rounded-md p-2"
      >
        <div class="text-lg text-slate-800 font-bold w-full text-center Estedad_FD_Bold">
          {{ item.title }}
        </div>
        <div class="text-sm text-slate-700 font-bold w-full text-center mt-3">
          مبلغ کل دریافتی: {{ item.PriceAll.toLocaleString('fa-IR') }} ریال
        </div>
        <div class="grid grid-cols-6 gap-5 w-full border-t border-slate-700 mt-2 py-2">
          <div
            v-for="(author, j) in item.Authors"
            :key="`author${j}`"
            class="my-2 bg-slate-200 flex flex-col justify-start items-center"
          >
            <span>{{ author.name }}</span>
            <span>درصد مشارکت: {{ author.percent }}%</span>
            <span>مبلغ: {{ author.price.toLocaleString('fa-IR') }} ریال</span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, computed } from 'vue';
  import * as XLSX from 'xlsx';
  
  interface Author {
    name: string;
    percent: number;
    price: number;
  }
  
  interface ParsedItem {
    title: string;
    ImpactFactor: number;
    PriceAll: number;
    Authors: Author[];
  }
  
  // درصدبندی تقسیم درآمد
  const PERCENTAGE_DATA = [
    { count: 1, PersonOne: 100, PersonOther: 0 },
    { count: 2, PersonOne: 90, PersonOther: 60 },
    { count: 3, PersonOne: 80, PersonOther: 50 },
    { count: 4, PersonOne: 70, PersonOther: 40 },
    { count: 5, PersonOne: 60, PersonOther: 30 },
    { count: 6, PersonOne: 50, PersonOther: 25 },
  ];
  
  const parsedData = ref<ParsedItem[]>([]);
  const file1 = ref<File | null>(null);
  const file2 = ref<File | null>(null);
  
  // نگاشت MIF: کلید = عنوان مقاله (trim و toLowerCase) -> مقدار MIF
  const mifMapping = ref<Record<string, number>>({});
  
  // نگهداری داده‌های خام مقالات (فایل اول)
  const rawArticleData = ref<any[][]>([]);
  
  // متغیرهای جستجو
  const searchText = ref('');
  const searchQuery = ref('');
  
  const filteredData = computed(() => {
    if (!searchQuery.value.trim()) return parsedData.value;
    const query = searchQuery.value.toLowerCase();
    return parsedData.value.filter((item) => {
      if (item.title && item.title.toLowerCase().includes(query)) return true;
      if (String(item.PriceAll).toLowerCase().includes(query)) return true;
      if (String(item.ImpactFactor).toLowerCase().includes(query)) return true;
      if (
        item.Authors.some(
          (author) =>
            (author.name && author.name.toLowerCase().includes(query)) ||
            String(author.price).toLowerCase().includes(query) ||
            String(author.percent).toLowerCase().includes(query)
        )
      )
        return true;
      return false;
    });
  });
  
  const performSearch = () => {
    searchQuery.value = searchText.value;
  };
  
  const resetSearch = () => {
    searchText.value = '';
    searchQuery.value = '';
  };
  
  const processAuthors = (authors: string[], totalPrice: number): Author[] => {
    const authorsCount = Math.min(authors.length, 6);
    const percentData = PERCENTAGE_DATA.find((data) => data.count === authorsCount);
    if (!percentData) {
      console.error('خطا در یافتن درصد مناسب برای تعداد نویسندگان:', authorsCount);
      return [];
    }
    return authors.map((author, index) => ({
      name: author,
      percent: index === 0 ? percentData.PersonOne : percentData.PersonOther,
      price: (totalPrice * (index === 0 ? percentData.PersonOne : percentData.PersonOther)) / 100,
    }));
  };
  
  // تابع محاسبه مبلغ برای مقالات انگلیسی با استفاده از IF و MIF
  const calculateEnglishPrice = (impactFactor: number, mif: number): number => {
    let price = (impactFactor / mif) * 15000000 * 3;
    if (price < 6000000) price = 6000000;
    if (price > 60000000) price = 60000000;
    return price;
  };
  
  // تابع پردازش داده‌های مقالات (فایل اول)
  const processArticles = () => {
    if (!rawArticleData.value || rawArticleData.value.length === 0) {
      console.warn('داده‌های فایل مقالات خالی است.');
      return;
    }
    
    console.log('تعداد ردیف‌های مقالات:', rawArticleData.value.length);
    
    parsedData.value = rawArticleData.value
      .filter((row) => row.length === 22 && row[0] !== 'DOI')
      .map((row) => {
        const impactFactor = parseFloat(row[9]);
        const title = row[18];
        const authorsList = row[19].split('*');
        // استفاده از عنوان به‌صورت lowercase و trimmed برای یافتن مقدار MIF
        const key = String(title).trim().toLowerCase();
        let mif = mifMapping.value[key];
        if (!mif) {
          console.warn(`برای مقاله "${title}" مقدار MIF یافت نشد. استفاده از مقدار پیش‌فرض 1.`);
          mif = 1;
        }
        const priceAll = calculateEnglishPrice(impactFactor, mif);
        const authors = processAuthors(authorsList, priceAll);
        return { title, ImpactFactor: impactFactor, PriceAll: priceAll, Authors: authors };
      });
    console.log('داده‌های پردازش شده مقالات:', parsedData.value);
  };
  
  // پردازش فایل MIF (فایل دوم)
  const handleFileUpload2 = (event: Event) => {
    const selectedFile = (event.target as HTMLInputElement).files?.[0];
    if (!selectedFile) return;
    file2.value = selectedFile;
    const reader = new FileReader();
    reader.readAsArrayBuffer(selectedFile);
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      console.log('نام برگه‌های فایل MIF:', workbook.SheetNames);
      if (!workbook.SheetNames.includes('MIF')) {
        console.error('تب "MIF" یافت نشد. برگه‌های موجود:', workbook.SheetNames);
        return;
      }
      const worksheet = workbook.Sheets['MIF'];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      console.log('داده‌های MIF:', jsonData);
      // نادیده گرفتن ردیف هدر (مثلاً ردیف اول) و استفاده از ستون 0 به عنوان کلید و ستون 5 به عنوان مقدار MIF
      jsonData.slice(1).forEach((row) => {
        if (row.length >= 6 && row[0] && row[5]) {
          const key = String(row[0]).trim().toLowerCase();
          const mifValue = parseFloat(row[5]);
          if (!isNaN(mifValue)) {
            mifMapping.value[key] = mifValue;
          }
        }
      });
      console.log('نگاشت MIF:', mifMapping.value);
      // اگر فایل مقالات نیز آپلود شده باشد، داده‌ها را پردازش می‌کنیم.
      if (file1.value) {
        processArticles();
      }
    };
  };
  
  // پردازش فایل مقالات (فایل اول)
  const handleFileUpload1 = (event: Event) => {
    const selectedFile = (event.target as HTMLInputElement).files?.[0];
    if (!selectedFile) return;
    file1.value = selectedFile;
    const reader = new FileReader();
    reader.readAsArrayBuffer(selectedFile);
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      console.log('نام برگه‌های فایل مقالات:', workbook.SheetNames);
      // استفاده از برگه "JCR-2023" یا در صورت عدم وجود، اولین برگه را انتخاب می‌کنیم
      let sheetName = 'JCR-2023';
      if (!workbook.SheetNames.includes('JCR-2023')) {
        sheetName = workbook.SheetNames[0];
        console.warn('تب "JCR-2023" یافت نشد. استفاده از برگه اول:', sheetName);
      }
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      rawArticleData.value = jsonData;
      console.log('داده‌های خام مقالات:', rawArticleData.value);
      // اگر فایل MIF نیز آپلود شده باشد، داده‌ها را پردازش می‌کنیم.
      if (file2.value) {
        processArticles();
      } else {
        console.warn('فایل MIF هنوز آپلود نشده است.');
        parsedData.value = [];
      }
    };
  };
  </script>
  
  <style scoped>
  /* استایل‌های مورد نظر خود را اینجا اضافه کنید */
  </style>
  