/**
 * Mock Data for FreeHunter Mobile App
 * This file contains sample data for development and testing
 */

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  timeline: string;
  skills: string[];
  clientName: string;
  clientRating: number;
  postedAt: string;
  applicants: number;
  isVerified: boolean;
  isFeatured: boolean;
}

export interface Freelancer {
  id: string;
  name: string;
  avatar: string;
  title: string;
  bio: string;
  rating: number;
  reviews: number;
  skills: string[];
  hourlyRate: number;
  location: string;
  isVerified: boolean;
  portfolio: string[];
  responseTime: string;
  completedJobs: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'client' | 'freelancer';
  bio: string;
  rating: number;
  location: string;
}

// Sample Jobs Data
export const mockJobs: Job[] = [
  {
    id: '1',
    title: '[長期合作] Looking for a high-energy English-speaking MC in Hong Kong',
    description: 'We are looking for a high-energy English-speaking MC / Event Host to support upcoming corporate events and produce a wrap-up video. Event Details • Hong Kong: 17 June @ Wan Chai Convention & Exhibition Centre ⸻ Scope of Work • Host / appear as MC during the event • Be featured in on-site filming (interactions, highlights, key moments) • Record voice-over (VO) after the event • Final deliverable: 40–60 min event wrap-up video',
    category: '活動及表演',
    budget: {
      min: 2000,
      max: 5000,
      currency: 'HKD',
    },
    location: '香港',
    timeline: '3日內',
    skills: ['商務司儀', '活動司儀'],
    clientName: 'Mika Cheng',
    clientRating: 4.8,
    postedAt: '8小時前',
    applicants: 5,
    isVerified: true,
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Short Marketing Video Required for Shop',
    description: 'Looking for professional video production for marketing purposes. Need high-quality editing and effects.',
    category: '攝影及影音製作',
    budget: {
      min: 2000,
      max: 5000,
      currency: 'HKD',
    },
    location: '香港',
    timeline: '30日內',
    skills: ['影片製作', '視頻編輯'],
    clientName: 'Andy K.',
    clientRating: 4.5,
    postedAt: '7小時前',
    applicants: 8,
    isVerified: true,
    isFeatured: false,
  },
  {
    id: '3',
    title: '學校慶祝活動拍照',
    description: '需要專業攝影師為學校慶祝活動拍照。40名兒童，3張集體照，以及孩子玩耍時自然抓拍。',
    category: '攝影及影音製作',
    budget: {
      min: 2000,
      max: 5000,
      currency: 'HKD',
    },
    location: '香港',
    timeline: '3日內',
    skills: ['活動攝影', '人像攝影'],
    clientName: 'Yvonne Lai',
    clientRating: 4.7,
    postedAt: '7小時前',
    applicants: 3,
    isVerified: false,
    isFeatured: false,
  },
  {
    id: '4',
    title: '[長期合作] 人工智能遊戲設計(毋須程式背景)',
    description: '我們正招聘一位富有創意，熟悉 AI 工具應用的遊戲設計師。',
    category: '開發與資訊科技',
    budget: {
      min: 10000,
      max: 50000,
      currency: 'HKD',
    },
    location: '香港',
    timeline: '30-90日內',
    skills: ['遊戲設計', 'AI工具'],
    clientName: 'J Wong',
    clientRating: 4.9,
    postedAt: '1日前',
    applicants: 12,
    isVerified: true,
    isFeatured: true,
  },
  {
    id: '5',
    title: '[長期合作] Freelance Digital Account Manager',
    description: 'We are seeking a Digital Account Manager with solid performance marketing knowledge (primarily Meta Ads) to manage client campaigns.',
    category: '數碼營銷及電商',
    budget: {
      min: 50000,
      max: 100000,
      currency: 'HKD',
    },
    location: '香港',
    timeline: '90日以上',
    skills: ['數碼營銷', 'Meta廣告', '客戶管理'],
    clientName: 'Samson Wong',
    clientRating: 4.6,
    postedAt: '1日前',
    applicants: 15,
    isVerified: true,
    isFeatured: true,
  },
];

// Sample Freelancers Data
export const mockFreelancers: Freelancer[] = [
  {
    id: 'f1',
    name: 'Gen Cheng',
    avatar: 'https://via.placeholder.com/100?text=Gen+Cheng',
    title: '平面設計',
    bio: 'Experience in commercial marketing materials design & creation. Experience in content creation.',
    rating: 4.9,
    reviews: 48,
    skills: ['平面設計', '品牌設計', '海報設計'],
    hourlyRate: 300,
    location: '香港',
    isVerified: true,
    portfolio: ['App介面設計', '卡片設計', '橫額設計'],
    responseTime: '1小時內',
    completedJobs: 156,
  },
  {
    id: 'f2',
    name: 'Wai Chan',
    avatar: 'https://via.placeholder.com/100?text=Wai+Chan',
    title: '平面設計',
    bio: 'thinking in reverse reformer is a Hong Kong based designer with 10+ years experience.',
    rating: 4.8,
    reviews: 62,
    skills: ['平面設計', '品牌設計', '網頁設計'],
    hourlyRate: 350,
    location: '香港',
    isVerified: true,
    portfolio: ['品牌識別系統', '包裝設計', '印刷設計'],
    responseTime: '2小時內',
    completedJobs: 203,
  },
  {
    id: 'f3',
    name: 'Yiu Pan Tang',
    avatar: 'https://via.placeholder.com/100?text=Yiu+Pan+Tang',
    title: '攝影服務',
    bio: '擅長風景拍攝、後期製作、Lightroom、Photoshop、Premiere、After Effect。',
    rating: 4.7,
    reviews: 35,
    skills: ['戶外攝影', '室內攝影', '人像攝影'],
    hourlyRate: 250,
    location: '香港',
    isVerified: true,
    portfolio: ['風景攝影', '人像攝影', '商業攝影'],
    responseTime: '30分鐘內',
    completedJobs: 89,
  },
  {
    id: 'f4',
    name: 'Serena HSU',
    avatar: 'https://via.placeholder.com/100?text=Serena+HSU',
    title: 'UI/UX 設計',
    bio: '盡力完成畫面的完整性。',
    rating: 4.9,
    reviews: 41,
    skills: ['UI設計', 'UX設計', '原型設計'],
    hourlyRate: 400,
    location: '香港',
    isVerified: true,
    portfolio: ['App界面設計', '網站設計', '交互原型'],
    responseTime: '1小時內',
    completedJobs: 127,
  },
  {
    id: 'f5',
    name: 'Henry L.',
    avatar: 'https://via.placeholder.com/100?text=Henry+L',
    title: '攝影服務',
    bio: 'Le Papillon Production. Our photography package includes solo portrait, fashion, product, family, event and so on.',
    rating: 4.8,
    reviews: 52,
    skills: ['人像攝影', '商業攝影', '婚禮攝影'],
    hourlyRate: 280,
    location: '香港',
    isVerified: true,
    portfolio: ['時裝攝影', '產品攝影', '活動攝影'],
    responseTime: '2小時內',
    completedJobs: 178,
  },
];

// Sample Categories
export const categories = [
  "攝影及影片製作",
  "網頁及程式開發",
  "數碼營銷",
  "翻譯服務",
  "平面設計",
  "繪畫及插圖",
  "活動及表演",
  "寵物服務",
  "會計管理",
  "清潔服務",
  "家居工程",
  "學科補習",
  "興趣學習",
  "其他",
];

// Sample User Data
export const mockUser: User = {
  id: 'user1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://via.placeholder.com/100?text=John+Doe',
  role: 'client',
  bio: 'Looking for talented freelancers to help with my projects.',
  rating: 4.5,
  location: '香港',
};
