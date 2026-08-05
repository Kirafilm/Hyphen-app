export type GuideSection = { h: string; p: string };
export type GuideLocaleCopy = {
  title: string;
  lead: string;
  sections: GuideSection[];
};
export type GuideDoc = {
  slug: string;
  path: string;
  /** Short label for index / footer */
  label: Record<"zh-HK" | "zh-TW" | "zh-Hans" | "en", string>;
  copy: Record<"zh-HK" | "zh-TW" | "zh-Hans" | "en", GuideLocaleCopy>;
};

export const GUIDES: GuideDoc[] = [
  {
    slug: "post-job",
    path: "/guides/post-job",
    label: {
      "zh-HK": "如何免費發佈工作",
      "zh-TW": "如何免費刊登案件",
      "zh-Hans": "如何免费发布工作",
      en: "How to post a job",
    },
    copy: {
      "zh-HK": {
        title: "如何在 Hyphen 免費發佈工作",
        lead: "如果你需要攝影師、設計師、程式開發、翻譯或活動支援等自由工作者，可以在 Hyphen 用電郵註冊後免費刊登工作。本文說明發佈前要準備什麼、怎樣寫清楚需求，以及如何安全聯絡 Freelancer。",
        sections: [
          {
            h: "誰適合發佈工作",
            p: "中小企、初創、活動主辦單位，以及需要短期或專案式協助的個人，都可以發佈。常見類型包括產品／活動攝影、短片製作、品牌設計、網站與 App、數碼廣告、翻譯校對、司儀與活動統籌等。發佈工作對發案方完全免費，平台不會向你抽取成交佣金。",
          },
          {
            h: "發佈前請準備這些資料",
            p: "寫清楚工作目標、交付內容、希望完成日期、預算範圍，以及工作地點（或註明可遙距）。預算可用固定金額，亦可寫「可議」或開放式上限。資料愈具體，合資格的 Freelancer 愈容易回應，減少來回問答時間。",
          },
          {
            h: "建議的發佈步驟",
            p: "一、用電郵註冊並登入。二、進入「發佈工作」，選擇行業分類。三、填寫標題、詳情、預算與地點（可開啟遙距）。四、提交後職位會出現在工作列表。五、收到申請或查詢後，按平台流程解鎖聯絡方式，直接與對方溝通範圍、檔期與收費。",
          },
          {
            h: "怎樣寫出吸引人的職位說明",
            p: "標題用一句話講清工作性質，例如「週末活動攝影師（中環，4 小時）」。正文分段寫：背景、必須具備的技能、交付格式、參考案例、預算與付款方式。避免只寫「急徵」而無細節；亦不要在公開欄位留下私人電話，待雙方確認合作意向後再交換聯絡資料。",
          },
          {
            h: "安全合作小提示",
            p: "先在平台內確認工作範圍與價錢，再決定匯款或簽約。大型項目可分期付款或要求簡單書面確認。若對方要求你離開平台後立即全額預付而拒絕提供作品集或過往案例，請提高警覺。有疑問可透過聯絡我們頁面或 hyphe.office@gmail.com 查詢。",
          },
        ],
      },
      "zh-TW": {
        title: "如何在 Hyphen 免費刊登案件",
        lead: "若你需要攝影、設計、程式、翻譯或活動支援等接案者，可在 Hyphen 以電子郵件註冊後免費刊登。本文說明刊登前準備、如何寫清楚需求，以及如何安全聯繫接案者。",
        sections: [
          {
            h: "誰適合刊登案件",
            p: "中小企業、新創、活動主辦單位與需要專案協助的個人皆可刊登。常見類型包含產品／活動攝影、短片、品牌設計、網站與 App、數位行銷、翻譯與活動統籌。案主刊登完全免費，平台不抽成交佣金。",
          },
          {
            h: "刊登前請準備",
            p: "寫清楚目標、交付內容、希望完成日期、預算與地點（或可遠端）。預算可為固定金額或可議。資訊愈具體，合適接案者愈容易回覆。",
          },
          {
            h: "建議步驟",
            p: "電子郵件註冊登入 → 選擇分類 → 填寫標題、詳情、預算與地點 → 送出後出現於職缺列表 → 確認合作意向後解鎖聯絡方式並自行溝通。",
          },
          {
            h: "怎麼寫職缺說明",
            p: "標題一句話講清性質；內文分段寫背景、必備技能、交付格式、預算與付款方式。避免公開欄位留下私人電話。",
          },
          {
            h: "安全合作提醒",
            p: "先確認範圍與價格再匯款。大型案件可分期。若對方要求立即全額預付又拒絕提供作品集，請提高警覺。疑問請來信 hyphe.office@gmail.com。",
          },
        ],
      },
      "zh-Hans": {
        title: "如何在 Hyphen 免费发布工作",
        lead: "如果你需要摄影、设计、开发、翻译或活动支持等自由职业者，可在 Hyphen 用电邮注册后免费发布。本文说明发布前准备、如何写清需求，以及如何安全联系对方。",
        sections: [
          {
            h: "谁适合发布",
            p: "中小企业、初创、活动主办方与需要短期项目协助的个人均可发布。发案方完全免费，平台不抽成。",
          },
          {
            h: "发布前准备",
            p: "写清目标、交付物、完成日期、预算与地点（或可远程）。信息越具体，合适的人越容易回应。",
          },
          {
            h: "建议步骤",
            p: "电邮注册登录 → 选择分类 → 填写详情与预算 → 上架 → 确认意向后解锁联系方式并自行沟通。",
          },
          {
            h: "如何写职位说明",
            p: "标题一句话说清性质；正文分段写背景、技能、交付格式与付款方式。勿在公开栏留私人电话。",
          },
          {
            h: "安全提示",
            p: "先确认范围与价格再付款。大项目可分期。对要求立即全额预付且拒绝提供作品集者提高警惕。",
          },
        ],
      },
      en: {
        title: "How to post a job free on Hyphen",
        lead: "Need a photographer, designer, developer, translator, or event support? Sign up with email and post for free. This guide covers what to prepare, how to write a clear brief, and how to contact freelancers safely.",
        sections: [
          {
            h: "Who should post",
            p: "SMEs, startups, event organisers, and individuals needing project-based help. Posting is free for clients; Hyphen does not take a commission on deals.",
          },
          {
            h: "Prepare before you post",
            p: "Write the goal, deliverables, deadline, budget, and location (or remote). Specific briefs get better responses.",
          },
          {
            h: "Suggested steps",
            p: "Sign up with email → choose a category → add title, details, budget, location → publish → unlock contact details after interest is clear, then communicate directly.",
          },
          {
            h: "Writing a strong brief",
            p: "Use a clear title and sections for background, required skills, deliverable format, and payment terms. Do not put private phone numbers in the public listing.",
          },
          {
            h: "Safety tips",
            p: "Agree scope and price before paying. For large projects, consider milestones. Be cautious if someone demands full prepayment without portfolio proof.",
          },
        ],
      },
    },
  },
  {
    slug: "freelance",
    path: "/guides/freelance",
    label: {
      "zh-HK": "如何在 Hyphen 接案",
      "zh-TW": "如何在 Hyphen 接案",
      "zh-Hans": "如何在 Hyphen 接案",
      en: "How to find freelance work",
    },
    copy: {
      "zh-HK": {
        title: "如何在 Hyphen 接 Freelance 工作",
        lead: "Hyphen 讓自由工作者用電郵快速開始瀏覽職位。本文說明怎樣篩選合適工作、何時需要訂閱解鎖聯絡資訊，以及怎樣向發案方專業回應。",
        sections: [
          {
            h: "適合哪些 Freelancer",
            p: "攝影與影片、音樂製作、網頁與程式、數碼營銷、翻譯、平面與插畫、室內設計、活動表演、寵物服務、會計、運動訓練等都可以在平台尋找短期或專案合作。新手亦可參與，但請誠實標示經驗與作品集連結。",
          },
          {
            h: "接案基本流程",
            p: "註冊後可免費瀏覽工作列表並用關鍵字、分類篩選。看到合適職位可了解詳情；若要取得發案方電話或電郵等聯絡方式，需訂閱月費或年費方案。解鎖後請盡快以專業訊息自我介紹，並詢問範圍、檔期與預算是否仍然有效。",
          },
          {
            h: "怎樣提高獲選機會",
            p: "回覆時簡潔說明相關經驗、可提供的交付物、檔期與報價方式。附上作品集或過往案例連結。不要一次複製貼上同一段訊息到所有職位；針對該案的地點、風格或技術要求寫一兩句，會更有說服力。",
          },
          {
            h: "訂閱與零抽成是什麼意思",
            p: "Hyphen 不從你與客戶的成交金額抽成。訂閱的用途是解鎖聯絡資訊與相關會員功能，讓雙方可以直接溝通。請在 App 或網站的訂閱頁查看最新方案與續訂說明；實際扣款以 App Store／Google Play 顯示為準。",
          },
          {
            h: "接案時的注意事項",
            p: "確認工作範圍、修改次數、版權與付款時間再開始執行。大型案子建議書面確認。若對方要求你先付「保證金」才能獲案，多數情況應拒絕。遇可疑訊息可截圖並電郵 hyphe.office@gmail.com 反映。",
          },
        ],
      },
      "zh-TW": {
        title: "如何在 Hyphen 接案",
        lead: "用電子郵件即可開始瀏覽職缺。本文說明如何篩選案件、何時需訂閱解鎖聯絡資訊，以及如何專業回覆案主。",
        sections: [
          {
            h: "適合誰",
            p: "攝影影音、音樂、網頁程式、數位行銷、翻譯、設計插畫、活動、寵物、會計、運動訓練等接案者皆可使用。請誠實標示經驗與作品集。",
          },
          {
            h: "基本流程",
            p: "免費瀏覽與篩選 → 查看詳情 → 訂閱後解鎖聯絡方式 → 自我介紹並確認範圍、檔期與預算。",
          },
          {
            h: "提高獲選機會",
            p: "回覆對應該案需求，附作品集，說明檔期與報價方式，避免群發同一段文字。",
          },
          {
            h: "訂閱與零抽成",
            p: "平台不抽成交佣金；訂閱用於解鎖聯絡與會員功能。方案以訂閱頁與商店顯示為準。",
          },
          {
            h: "注意事項",
            p: "先確認範圍、修改次數、版權與付款再開工。勿支付可疑「保證金」。問題可來信 hyphe.office@gmail.com。",
          },
        ],
      },
      "zh-Hans": {
        title: "如何在 Hyphen 接案",
        lead: "用电邮即可浏览职位。本文说明如何筛选、何时订阅解锁联系方式，以及如何专业回复发案方。",
        sections: [
          {
            h: "适合谁",
            p: "摄影视频、音乐、开发、营销、翻译、设计、活动等自由职业者均可使用。请诚实标注经验与作品集。",
          },
          {
            h: "基本流程",
            p: "免费浏览筛选 → 查看详情 → 订阅后解锁联系方式 → 自我介绍并确认范围、档期与预算。",
          },
          {
            h: "提高获选机会",
            p: "针对该案回复，附作品集，说明档期与报价，避免群发相同内容。",
          },
          {
            h: "订阅与零抽成",
            p: "平台不抽成；订阅用于解锁联系与会员功能。以订阅页与应用商店显示为准。",
          },
          {
            h: "注意事项",
            p: "先确认范围与付款再开工。勿支付可疑保证金。问题可电邮 hyphe.office@gmail.com。",
          },
        ],
      },
      en: {
        title: "How to find freelance work on Hyphen",
        lead: "Browse jobs with email signup. Learn how to filter listings, when a subscription unlocks contacts, and how to reply professionally.",
        sections: [
          {
            h: "Who it is for",
            p: "Photographers, developers, marketers, translators, designers, event talent, and more. Be honest about experience and share a portfolio.",
          },
          {
            h: "Basic flow",
            p: "Browse free → open a job → subscribe to unlock contact details → introduce yourself and confirm scope, timing, and budget.",
          },
          {
            h: "Win more work",
            p: "Tailor each reply, attach portfolio links, and state availability and pricing approach. Avoid identical copy-paste messages.",
          },
          {
            h: "Subscription vs commission",
            p: "Hyphen does not take a cut of your deal. Subscriptions unlock contacts and member features. Store pricing is authoritative.",
          },
          {
            h: "Stay safe",
            p: "Confirm scope, revisions, rights, and payment before starting. Do not pay suspicious “deposits” to win a job.",
          },
        ],
      },
    },
  },
  {
    slug: "pricing",
    path: "/guides/pricing",
    label: {
      "zh-HK": "收費與零抽成說明",
      "zh-TW": "收費與零抽成說明",
      "zh-Hans": "收费与零抽成说明",
      en: "Pricing and zero commission",
    },
    copy: {
      "zh-HK": {
        title: "Hyphen 收費說明：發案免費、零抽成",
        lead: "很多人會問：Hyphen 收費嗎？有沒有抽成？本文用清楚語言說明發案方、接案方分別怎樣收費，以及訂閱解鎖聯絡資訊的用途，避免誤解。",
        sections: [
          {
            h: "發案方（僱主）",
            p: "刊登工作、管理自己發出的職位，核心流程免費。我們不會因為你找到 Freelancer 或完成合作而向你抽取成交百分比。你與 Freelancer 之間的服務費由雙方自行議定與支付。",
          },
          {
            h: "接案方（Freelancer）",
            p: "瀏覽職位與了解公開詳情可免費進行。若要查看發案方的電話、電郵等直接聯絡方式，需要有效訂閱（月費或年費，以產品頁為準）。訂閱不是「抽成」，而是會員解鎖功能；成交金額不會被平台抽走一部分。",
          },
          {
            h: "為什麼採用訂閱而不是抽成",
            p: "抽成模式常令雙方要在平台內完成付款，並在每一單被扣百分比。Hyphen 希望把溝通交回雙方：談妥範圍與價錢後，用你習慣的方式收款。訂閱則用於維持平台營運，並讓認真接案的人取得聯絡資訊。",
          },
          {
            h: "付款與取消",
            p: "若你透過 iOS／Android App 訂閱，扣款與取消／退款規則以 Apple App Store 或 Google Play 為準。請在系統訂閱管理中關閉自動續訂。網站或 App 內的說明頁亦會標示最新方案資訊。",
          },
          {
            h: "廣告與其他",
            p: "網站部分頁面可能顯示 Google AdSense 廣告，用以支援免費內容與平台營運；詳見私隱政策。廣告與你的 Freelancer 服務費無關，亦不是成交抽成。",
          },
        ],
      },
      "zh-TW": {
        title: "Hyphen 收費說明：刊登免費、零抽成",
        lead: "Hyphen 收費嗎？有沒有抽成？本文說明案主與接案者的費用差異，以及訂閱解鎖聯絡資訊的用途。",
        sections: [
          {
            h: "案主",
            p: "刊登與管理案件核心流程免費，不抽成交佣金。服務費由雙方自行議定支付。",
          },
          {
            h: "接案者",
            p: "免費瀏覽職缺；解鎖電話／電子郵件等聯絡方式需有效訂閱。訂閱不是抽成。",
          },
          {
            h: "為何用訂閱",
            p: "讓雙方直接溝通與收款，平台不以每筆成交抽成。訂閱用於營運與解鎖聯絡功能。",
          },
          {
            h: "付款與取消",
            p: "App 內購以 App Store／Google Play 規則為準，請在系統設定管理自動續訂。",
          },
          {
            h: "廣告",
            p: "網站可能顯示 AdSense 廣告，與接案服務費無關。詳見隱私權政策。",
          },
        ],
      },
      "zh-Hans": {
        title: "Hyphen 收费说明：发案免费、零抽成",
        lead: "Hyphen 收费吗？有没有抽成？本文说明发案方与接案方费用，以及订阅解锁联系方式的用途。",
        sections: [
          {
            h: "发案方",
            p: "发布与管理职位核心流程免费，不抽成。服务费由双方自行约定支付。",
          },
          {
            h: "接案方",
            p: "可免费浏览；解锁电话／电邮等联系方式需有效订阅。订阅不是抽成。",
          },
          {
            h: "为何用订阅",
            p: "双方直接沟通收款，平台不以每单抽成。订阅用于运营与解锁联系功能。",
          },
          {
            h: "付款与取消",
            p: "App 内购以应用商店规则为准，请在系统设置管理自动续订。",
          },
          {
            h: "广告",
            p: "网站可能显示 AdSense，与服务费无关。详见隐私政策。",
          },
        ],
      },
      en: {
        title: "Hyphen pricing: free posting, zero commission",
        lead: "Do we charge? Is there a commission? Here is how client and freelancer pricing works, and what subscriptions unlock.",
        sections: [
          {
            h: "Clients",
            p: "Posting and managing jobs is free. We do not take a percentage of your deal. You pay freelancers directly as you agree.",
          },
          {
            h: "Freelancers",
            p: "Browse free. Unlocking client phone/email requires an active subscription. That is not a commission on your project fee.",
          },
          {
            h: "Why subscriptions",
            p: "We want direct communication and payment between parties. Subscriptions fund the platform and unlock contact details.",
          },
          {
            h: "Billing and cancel",
            p: "App subscriptions follow App Store / Google Play rules. Manage auto-renew in system settings.",
          },
          {
            h: "Ads",
            p: "Some web pages may show AdSense ads. They are unrelated to your freelance fees—see the Privacy Policy.",
          },
        ],
      },
    },
  },
  {
    slug: "getting-started",
    path: "/guides/getting-started",
    label: {
      "zh-HK": "新手入門：30 秒開始",
      "zh-TW": "新手入門：快速開始",
      "zh-Hans": "新手入门：快速开始",
      en: "Getting started in 30 seconds",
    },
    copy: {
      "zh-HK": {
        title: "新手入門：用電郵 30 秒開始用 Hyphen",
        lead: "Hyphen 強調低門檻：不強迫先交身分證才能瀏覽。無論你是想請人，還是想接案，都可以先由電郵註冊開始。以下是建議的第一步。",
        sections: [
          {
            h: "第一步：註冊",
            p: "開啟網站或 App，用電郵完成註冊／登入。請使用你常用且能接收通知的電郵。註冊後即可瀏覽職位或進入發佈流程。",
          },
          {
            h: "如果你是發案方",
            p: "先想清楚預算與交付物，再到「發佈工作」選擇分類並填寫詳情。發佈免費。可先瀏覽現有職位，了解市場常見預算與描述寫法。詳見《如何免費發佈工作》指南。",
          },
          {
            h: "如果你是 Freelancer",
            p: "先用分類與關鍵字找適合自己技能的工作，準備好作品集連結。需要聯絡發案方時再考慮訂閱。詳見《如何在 Hyphen 接 Freelance 工作》與《收費說明》。",
          },
          {
            h: "香港與台灣使用者",
            p: "網站提供繁體中文（香港／台灣）等語系。台灣使用者亦可留意 /tw 專頁說明。法律條款請分別閱讀適用的私隱政策與使用條款。",
          },
          {
            h: "需要協助",
            p: "帳號、訂閱或職位問題，可到「聯絡我們」或電郵 hyphe.office@gmail.com。我們會在合理時間內回覆。",
          },
        ],
      },
      "zh-TW": {
        title: "新手入門：用電子郵件快速開始",
        lead: "無論發案或接案，都可先以電子郵件註冊。以下是建議的第一步。",
        sections: [
          {
            h: "註冊",
            p: "在網站或 App 以電子郵件註冊／登入，即可瀏覽職缺或刊登案件。",
          },
          {
            h: "我是案主",
            p: "準備預算與交付物後免費刊登。可先參考現有職缺寫法。詳見刊登指南。",
          },
          {
            h: "我是接案者",
            p: "先篩選職缺並準備作品集；需要聯絡時再訂閱。詳見接案與收費指南。",
          },
          {
            h: "語系與地區",
            p: "支援繁中等語系；台灣使用者可參考 /tw。請閱讀適用之隱私權政策與條款。",
          },
          {
            h: "需要協助",
            p: "請至聯繫我們或來信 hyphe.office@gmail.com。",
          },
        ],
      },
      "zh-Hans": {
        title: "新手入门：用电邮快速开始",
        lead: "无论发案或接案，都可先用电邮注册。以下是建议的第一步。",
        sections: [
          {
            h: "注册",
            p: "在网站或 App 用电邮注册／登录，即可浏览职位或发布工作。",
          },
          {
            h: "我是发案方",
            p: "准备预算与交付物后免费发布。可先参考现有职位写法。",
          },
          {
            h: "我是自由职业者",
            p: "先筛选职位并准备作品集；需要联系时再订阅。",
          },
          {
            h: "语言与地区",
            p: "支持多语系。请阅读适用的隐私政策与条款。",
          },
          {
            h: "需要帮助",
            p: "请至联系我们或电邮 hyphe.office@gmail.com。",
          },
        ],
      },
      en: {
        title: "Getting started: email signup in seconds",
        lead: "Whether you hire or freelance, start with email. Here are the first steps.",
        sections: [
          {
            h: "Sign up",
            p: "Register on web or app with email, then browse jobs or post a brief.",
          },
          {
            h: "If you hire",
            p: "Prepare budget and deliverables, then post free. See the posting guide.",
          },
          {
            h: "If you freelance",
            p: "Filter jobs and ready your portfolio; subscribe when you need contacts.",
          },
          {
            h: "Languages",
            p: "Traditional Chinese and English are available. Read the privacy policy and terms that apply to you.",
          },
          {
            h: "Help",
            p: "Use Contact us or email hyphe.office@gmail.com.",
          },
        ],
      },
    },
  },
];

export function getGuide(slug: string): GuideDoc | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function guideCopy(guide: GuideDoc, locale: string): GuideLocaleCopy {
  const key = (["zh-HK", "zh-TW", "zh-Hans", "en"].includes(locale) ? locale : "zh-HK") as
    | "zh-HK"
    | "zh-TW"
    | "zh-Hans"
    | "en";
  return guide.copy[key];
}

export function guideLabel(guide: GuideDoc, locale: string): string {
  const key = (["zh-HK", "zh-TW", "zh-Hans", "en"].includes(locale) ? locale : "zh-HK") as
    | "zh-HK"
    | "zh-TW"
    | "zh-Hans"
    | "en";
  return guide.label[key];
}
