<template>
  <div class="flex flex-col w-full p-5 Estedad_FD_Light" style="direction: rtl;">
    <div class="flex text-center justify-between mx-28 mt-10">
      <!-- بخش انتخاب فایل -->
      <div class="text-center flex">
        <label for="file-upload" class="cursor-pointer bg-blue-500 text-white py-2 ml-4 px-4 rounded-lg hover:bg-blue-600 transition duration-300">
          فایل را انتخاب کنید
        </label>
        <input id="file-upload" class="hidden" type="file" @change="handleFileUpload" accept=".xlsx, .xls" />
        <p class="text-gray-600 mt-2" v-if="!file">هیچ فایلی انتخاب نشده است</p>
        <p class="text-gray-600 mt-2" v-else>فایل انتخاب شده: {{ file.name }}</p>
      </div>
      
      <!-- بخش جستجو -->
      <div class="flex justify-center items-center">
        <input v-model="searchText" type="text" placeholder="جستجو (مثلاً نام یا مبلغ)" class="border rounded py-2 px-3 w-64" />
        <button @click="performSearch" class="bg-green-500 ml-1 text-white py-2 px-4 rounded-lg mr-2">جستجو</button>
        <button @click="resetSearch" class="bg-gray-500 text-white py-2 px-4 rounded-lg">حذف جستجو</button>
      </div>
    </div>
    
    <!-- نمایش داده‌های فیلتر شده -->
    <div class="my-2 bg-slate-200 flex flex-col justify-center items-center border border-slate-700 rounded-md p-2" v-for="(item, i) in filteredData" :key="`data_${i}`">
      <div class="text-lg text-slate-800 font-bold w-full text-center Estedad_FD_Bold">{{ item.title }}</div>
      <div class="text-sm text-slate-700 font-bold w-full text-center mt-3">مبلغ کل دریافتی : {{ item.PriceAll.toLocaleString('fa-IR') }} ریال</div>
      <div class="grid grid-cols-6 gap-5 w-full border-t border-slate-700 mt-2 py-2">
        <div class="my-2 bg-slate-200 flex flex-col justify-start items-center" v-for="(author, j) in item.Authors" :key="`author${j}`">
          <span>{{ author.name }}</span>
          <span> درصد مشارکت : {{ author.percent }}% </span>
          <span> مبلغ : {{ author.price.toLocaleString('fa-IR') }} ریال</span>
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

const PERCENTAGE_DATA = [
  { count: 1, PersonOne: 100, PersonOther: 0 },
  { count: 2, PersonOne: 90, PersonOther: 60 },
  { count: 3, PersonOne: 80, PersonOther: 50 },
  { count: 4, PersonOne: 70, PersonOther: 40 },
  { count: 5, PersonOne: 60, PersonOther: 30 },
  { count: 6, PersonOne: 50, PersonOther: 25 },
];

const parsedData = ref<ParsedItem[]>([]);
const file = ref<File | null>(null);
const searchText = ref('');
const searchQuery = ref('');

const filteredData = computed(() => {
  if (!searchQuery.value.trim()) return parsedData.value;
  const query = searchQuery.value.toLowerCase();
  return parsedData.value.filter(item =>
    item.title?.toLowerCase().includes(query) ||
    String(item.PriceAll).toLowerCase().includes(query) ||
    String(item.ImpactFactor).toLowerCase().includes(query) ||
    item.Authors.some(author =>
      author.name?.toLowerCase().includes(query) ||
      String(author.price).toLowerCase().includes(query) ||
      String(author.percent).toLowerCase().includes(query)
    )
  );
});

const performSearch = () => {
  searchQuery.value = searchText.value;
};

const resetSearch = () => {
  searchText.value = '';
  searchQuery.value = '';
};

const calculatePrice = (impactFactor: number): number => {
  let price = (1.5 * impactFactor + 0.25) * 15000000 * 2;
  return Math.min(price, 25000000);
};

const processAuthors = (authors: string[], totalPrice: number, status: string): Author[] => {
  let processedAuthors = [...authors];
  if (status.trim() === "مستخرج از پايان نامه دانشجوي هيات علمي" && processedAuthors.length > 1) {
    processedAuthors.shift();
  }

  const authorsCount = Math.min(processedAuthors.length, 6);
  const percentData = PERCENTAGE_DATA.find(data => data.count === authorsCount);
  if (!percentData) return [];

  return processedAuthors.map((author, index) => ({
    name: author,
    percent: index === 0 ? percentData.PersonOne : percentData.PersonOther,
    price: (totalPrice * (index === 0 ? percentData.PersonOne : percentData.PersonOther)) / 100,
  }));
};

const handleFileUpload = (event: Event) => {
  const selectedFile = (event.target as HTMLInputElement).files?.[0];
  if (!selectedFile) return;
  file.value = selectedFile;
  const reader = new FileReader();
  reader.readAsArrayBuffer(selectedFile);
  reader.onload = (e: ProgressEvent<FileReader>) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    parsedData.value = jsonData
      .filter(row => row.length === 22 && row[0] !== 'DOI')
      .map(row => {
        const impactFactor = parseFloat(row[9]);
        const authorsList = (row[19] || "").split('*').map(name => name.trim());
        const title = row[18];
        const status = String(row[13]).trim();
        const priceAll = calculatePrice(impactFactor);
        const authors = processAuthors(authorsList, priceAll, status);
        return { title, ImpactFactor: impactFactor, PriceAll: priceAll, Authors: authors };
      });
  };
};
</script>

<style scoped>
/* استایل‌های اضافی */
</style>
