/**
 * 人生重開機：性別認同與生物性徵互動敘事遊戲
 * 
 * 使用方式（Vite 專案）:
 * 1. npm install react tailwindcss -D
 * 2. 將此檔案放入 src/App.jsx
 * 3. npm run dev
 * 
 * 遊戲設計：
 * - 5 章人生節點，每章 2-4 個選擇
 * - 四條指標系統：Understanding, Safety, Connection, Stress
 * - 開局隨機抽卡決定「身體設定」與「社會情境」
 * - 每章解鎖知識卡，最終顯示 6+ 種結局
 */

import React, { useState, useReducer } from 'react';

/**
 * ==================== 遊戲資料結構 ====================
 */

// 身體設定卡池（基於文章深化）
const BODY_TRAITS = [
  {
    id: 'typical_male',
    name: '外觀典型「男性特徵」',
    description: '出生時有陰莖與陰囊，醫生勾選「男」。按照社會期待，這是「生理男」。',
    bgColor: 'bg-blue-100',
    detail: '但即使在「典型」的身體中，荷爾蒙、內部生殖器、甚至染色體也可能不同於預期。'
  },
  {
    id: 'typical_female',
    name: '外觀典型「女性特徵」',
    description: '出生時有陰阜與陰道開口，醫生勾選「女」。按照社會期待，這是「生理女」。',
    bgColor: 'bg-pink-100',
    detail: '但即使在「典型」的身體中，荷爾蒙、內部生殖器、甚至染色體也可能不同於預期。'
  },
  {
    id: 'ambiguous_intersex',
    name: '出生時外生殖器不明確（雙性人）',
    description: '醫生看不出是陰莖還是陰蒂、不確定是陰囊還是大陰唇。這個嬰兒可能被標記為「性別不明」或被醫生與家長「決定」為某一性別。',
    bgColor: 'bg-purple-100',
    detail: '在只有「男」「女」法律性別選項的台灣，這些嬰兒最終都被塞進二元框架。'
  },
  {
    id: 'cais_xychromosome',
    name: '全面雄性激素不敏感症（CAIS）',
    description: '染色體是 XY（典型「男性」），但體內細胞無法接收睪丸分泌的雄性激素。結果：發育出外陰和陰道，但沒有子宮卵巢，沒有月經。醫生勾選「女」。',
    bgColor: 'bg-indigo-100',
    detail: '像故事中的 Alicia：在醫生的「癌症風險」理由下，未滿一歲就被迫進行睪丸切除手術。'
  },
  {
    id: 'late_difference',
    name: '幼年期看似典型，青春期才顯現差異',
    description: '出生時外生殖器清晰，指定為某性別。但青春期時，身體出現意外的變化：可能同時長出胸部和陽毛，聲音變化不符預期，或月經姍姍來遲。',
    bgColor: 'bg-orange-100',
    detail: '許多生物多樣性狀態在青春期才因荷爾蒙作用而顯現。這不是「異常」，是人類生物多樣性的一部分。'
  },
  {
    id: 'mosaic_combination',
    name: '生物性徵的混合組合',
    description: '身體呈現社會期待之外的特徵組合：也許同時有睪丸和卵巢組織、也許第二性徵既有「男性」也有「女性」特徵、也許月經與鬍鬚同時出現。',
    bgColor: 'bg-yellow-100',
    detail: '根據美國雙性人組織 interAct，超過 40 種不同的醫療條件都在「雙性人」的傘狀範圍內。'
  }
];

// 社會情境卡池
const SOCIAL_CONTEXTS = [
  {
    id: 'conservative_family',
    name: '保守家庭，性別規範明確',
    description: '家人與親戚對性別角色期待高，醫療決定由家長掌控',
    icon: '👨‍👩‍👧',
    stressBonus: 15,
    choiceCount: 1  // 選擇被限制
  },
  {
    id: 'progressive_family',
    name: '開明家庭，尊重個人差異',
    description: '家人願意傾聽個人想法，醫療決定有共同商量的空間',
    icon: '🌈',
    stressBonus: -10,
    choiceCount: 5  // 所有選項都可得
  },
  {
    id: 'rural_limited',
    name: '偏鄉醫療資源不足',
    description: '當地醫療選項少，就診要走遠路，隱私暴露風險高',
    icon: '🏞️',
    stressBonus: 20,
    choiceCount: 2  // 選擇很有限
  },
  {
    id: 'urban_intense',
    name: '城市資源豐富但社會標籤強',
    description: '醫療選項多，但性別期待與社交標籤也更多',
    icon: '🏙️',
    stressBonus: 10,
    choiceCount: 4  // 選項相對多
  },
  {
    id: 'strict_school',
    name: '學校性別規範嚴格',
    description: '校規對穿著、設施、活動的性別區分明確',
    icon: '📚',
    stressBonus: 18,
    choiceCount: 1  // 幾乎沒得選
  },
  {
    id: 'supportive_peers',
    name: '同儕支持高，但家人態度保留',
    description: '朋友接納，家人卻有顧慮，造成內外世界的落差',
    icon: '👫',
    stressBonus: 5,
    choiceCount: 4  // 選項相對多
  }
];

// 人生章節
const CHAPTERS = [
  {
    id: 'birth',
    number: 1,
    name: '出生',
    narrative: '醫生在產房看著你的外生殖器。「這是男孩」還是「這是女孩」？或者，外生殖器模糊不清，醫生需要做決定——一個看起來簡單的醫學判斷，卻會影響你的名字、戶籍、身份，以及接下來的一整個人生。',
    choices: [
      {
        id: 'birth_1',
        text: '醫生根據外生殖器快速做出決定，你的父母接受這個決定',
        impact: { understanding: 0, safety: 5, connection: 10, stress: 5 },
        knowledge: 'assigned_sex'
      },
      {
        id: 'birth_2',
        text: '父母詢問醫生：只看外生殖器就能確定嗎？還有其他檢查嗎？',
        impact: { understanding: 15, safety: 10, connection: 5, stress: 10 },
        knowledge: 'sex_characteristics'
      },
      {
        id: 'birth_3',
        text: '醫生告訴父母：外生殖器不清晰，可能需要檢查。但檢查要不要做？現在決定性別還是等等？',
        impact: { understanding: 20, safety: -5, connection: 0, stress: 25 },
        knowledge: 'intersex_discovery'
      },
      {
        id: 'birth_4',
        text: '父母簽同意書，醫生要在幾週內做染色體檢查、超音波、荷爾蒙檢查來「確定」性別',
        impact: { understanding: 20, safety: 10, connection: -5, stress: 20 },
        knowledge: 'medical_testing'
      }
    ]
  },
  {
    id: 'childhood',
    number: 2,
    name: '幼年期',
    narrative: '你還很小。父母根據醫生的診斷或建議，做著關於你身體的決定。也許醫生說「為了預防癌症」或「為了符合社會期待」，要求做某種手術或治療。也許親戚問：「這是男生還是女生？」父母不知道該怎麼解釋。日常中，你被指定為某個性別，穿上該性別的衣服，被教導該性別「應該」的行為。',
    choices: [
      {
        id: 'childhood_1',
        text: '父母同意醫生建議的醫療程序（手術或激素治療），因為醫生說「這是為了你好」',
        impact: { understanding: 0, safety: -15, connection: 5, stress: 25 },
        knowledge: 'medical_autonomy'
      },
      {
        id: 'childhood_2',
        text: '父母要求醫生詳細解釋：為什麼要做？有什麼風險？有其他選擇嗎？',
        impact: { understanding: 20, safety: 15, connection: 10, stress: -5 },
        knowledge: 'informed_consent'
      },
      {
        id: 'childhood_3',
        text: '父母感到困惑，決定先觀察，暫時不做任何醫療介入',
        impact: { understanding: 10, safety: 10, connection: 5, stress: 10 },
        knowledge: 'watchful_waiting'
      },
      {
        id: 'childhood_4',
        text: '按照指定性別的角色玩耍、穿著。但你內心對某些規則感到困惑或抗拒',
        impact: { understanding: 5, safety: 5, connection: 10, stress: 15 },
        knowledge: 'gender_socialization'
      },
      {
        id: 'childhood_5',
        text: '醫生威脅父母：如果不立即進行不可逆轉的醫療程序，你會「變壞」。父母被恐嚇，強行簽署同意書',
        impact: { understanding: -20, safety: -50, connection: -30, stress: 50 },
        knowledge: 'medical_coercion'
      }
    ]
  },
  {
    id: 'puberty',
    number: 3,
    name: '青春期',
    narrative: '你的身體開始改變。有些變化符合指定性別的期待，有些不符。也許月經沒來，也許長出胸部與鬍鬚，也許聲音變化不符預期。體育課、游泳課、更衣室——那些暴露身體的時刻變得尷尬和焦慮。同學的眼光、自己的困惑、該不該告訴父母。如果身體在「違背」醫生年幼時的決定，現在該怎麼辦？',
    choices: [
      {
        id: 'puberty_1',
        text: '接受身體的改變，即使不完全符合指定性別的期待，告訴自己「每個人都不同」',
        impact: { understanding: 10, safety: 10, connection: 10, stress: 0 },
        knowledge: 'puberty_diversity'
      },
      {
        id: 'puberty_2',
        text: '向父母或醫生表達擔憂：「為什麼我的身體不像別人？」',
        impact: { understanding: 20, safety: 15, connection: 10, stress: 5 },
        knowledge: 'intersex_experience'
      },
      {
        id: 'puberty_3',
        text: '發現身體的變化與童年的醫療決定有關，感到被欺騙和憤怒',
        impact: { understanding: 15, safety: -20, connection: -15, stress: 30 },
        knowledge: 'medical_trauma'
      },
      {
        id: 'puberty_4',
        text: '在線上社群或朋友間找到相似經驗的人，感到釋然「不是只有我」',
        impact: { understanding: 15, safety: 5, connection: 25, stress: -10 },
        knowledge: 'peer_support'
      },
      {
        id: 'puberty_5',
        text: '家人或老師發現你的身體「異常」，開始在學校、家庭中暴露你的秘密。你變成了嘲笑和孤立的對象',
        impact: { understanding: -10, safety: -45, connection: -40, stress: 45 },
        knowledge: 'bullying_trauma'
      }
    ]
  },
  {
    id: 'early_adulthood',
    number: 4,
    name: '成年初期',
    narrative: '證件要填了、工作環境要適應、和親密對象的溝通、更多醫療決定要做。每個環節都牽涉「要對誰說真話、要隱瞞什麼」的抉擇。',
    choices: [
      {
        id: 'adulthood_1',
        text: '向醫療人員咨詢：在同意的前提下，如何管理隱私邊界',
        impact: { understanding: 25, safety: 20, connection: 15, stress: -5 },
        knowledge: 'medical_privacy'
      },
      {
        id: 'adulthood_2',
        text: '根據不同情境選擇性地揭露個人資訊（工作、醫療、親密關係分別處理）',
        impact: { understanding: 20, safety: 15, connection: 10, stress: 10 },
        knowledge: 'selective_disclosure'
      },
      {
        id: 'adulthood_3',
        text: '完全公開身體與身份的所有細節，不怕他人評價',
        impact: { understanding: 15, safety: -20, connection: 20, stress: 20 },
        knowledge: 'bodily_autonomy'
      },
      {
        id: 'adulthood_4',
        text: '為了「融入正常」，徹底改造自己的外表與行為。隱藏一切不符合期待的特徵，即使代價是否認自我',
        impact: { understanding: -20, safety: 5, connection: -30, stress: 35 },
        knowledge: 'forced_assimilation'
      },
      {
        id: 'adulthood_5',
        text: '雇主、伴侶或親友發現你的「秘密」。他們用羞辱、威脅或遺棄來控制你。你陷入無路可退的困境',
        impact: { understanding: -15, safety: -55, connection: -50, stress: 55 },
        knowledge: 'relational_abuse'
      }
    ]
  },
  {
    id: 'turning_point',
    number: 5,
    name: '轉折',
    narrative: '一次重大的人生決定。也許是選擇改變法律性別、也許是拒絕一項醫療程序、也許是公開一直隱藏的真相。這個選擇會影響你的故事如何落幕。',
    choices: [
      {
        id: 'turning_1',
        text: '完全接納現狀，停止所有掙扎，選擇與自己和解',
        impact: { understanding: 15, safety: 20, connection: 10, stress: -20 },
        knowledge: 'acceptance'
      },
      {
        id: 'turning_2',
        text: '主動改變：無論是法律、醫療、或社交，都按自己的意願重塑身份',
        impact: { understanding: 20, safety: -10, connection: 5, stress: 10 },
        knowledge: 'self_determination'
      },
      {
        id: 'turning_3',
        text: '成為他人的資源：分享故事，幫助同樣困惑的人',
        impact: { understanding: 20, safety: 10, connection: 30, stress: 0 },
        knowledge: 'solidarity'
      },
      {
        id: 'turning_4',
        text: '尋求專業支持：心理治療師、醫生、社工、法律顧問',
        impact: { understanding: 25, safety: 25, connection: 20, stress: -15 },
        knowledge: 'professional_support'
      },
      {
        id: 'turning_5',
        text: '放棄一切。沒有人理解，改變也沒有意義。你選擇了自我孤立，甚至傷害自己',
        impact: { understanding: -30, safety: -60, connection: -50, stress: 55 },
        knowledge: 'crisis_point'
      }
    ]
  }
];

// 知識卡
const KNOWLEDGE_CARDS = {
  assigned_sex: {
    title: '「指定性別」：看外生殖器決定的簡化判斷',
    content: `出生時，醫生看著嬰兒的外生殖器做決定：「有陰莖 = 男」、「有陰道 = 女」、「模糊不清 = 未定」。這被記在出生證明上，叫做「出生者之性別」或「指定性別」。在台灣，接著進行戶籍登記時，這個指定就變成了「法律性別」。看起來簡單，但這個決定只看了身體的一個面向（外生殖器），忽略了生物性的其他複雜層次（染色體、荷爾蒙、內部生殖器等）。而且，這個「簡化判斷」會對一個人的一生產生深遠影響。`
  },
  sex_characteristics: {
    title: '生物性徵的多層次：不只是外生殖器',
    content: `「生物性」包含許多層面：外生殖器、內生殖器、性染色體（XX、XY、鑲嵌型等）、荷爾蒙濃度、第二性徵（乳房、鬍鬚、音聲、骨骼等）、骨盆形狀、脂肪分佈等。重點是：這些層面在不同人身上的組合是多樣的。有人所有層面都「典型一致」，有人某些層面不一致。「生理男」和「生理女」是社會簡化的說法，無法準確描述人類生物的複雜性。每個人的身體都是獨特的組合。`
  },
  intersex_discovery: {
    title: '雙性人（Intersex）：被塞進二元框架的身體',
    content: `「雙性人」是指天生擁有不符合典型「男性」或「女性」定義的生物性徵的人。根據美國雙性人組織 interAct 的統計，超過 40 種不同的醫療狀況都在雙性人的傘狀範圍內。在台灣，2004-2024 年僅有 21 名新生兒被記載為「性別不明」，但實際的雙性人數量遠高於此——因為許多醫生和家長會強行「決定」一個性別。許多雙性人嬰兒因此遭遇未經同意的手術，企圖「修正」其身體以符合社會的二元期待。`
  },
  medical_testing: {
    title: '如何檢查生物性：從染色體到荷爾蒙',
    content: `當外生殖器模糊或有疑慮時，醫生可能會做各種檢查：羊膜穿刺或血液檢查來看染色體（XX 或 XY）、超音波來看內生殖器（子宮、卵巢、睪丸等）、荷爾蒙檢查（雌激素、睪固酮等）。這些檢查的目的應該是提供完整的醫療信息，而不是為了「決定」性別。重點是：這些檢查應該基於「知情同意」，父母和當事人應該了解為什麼要做、怎麼做、結果代表什麼，以及這些結果如何影響醫療決定。`
  },
  medical_autonomy: {
    title: '誰決定孩子的身體：醫療決定權與身體自主',
    content: `童年時期，父母通常代表孩子做醫療決定。但問題是：醫生有時候會建議「為了預防風險」或「為了符合社會期待」對孩子進行不必要的手術——甚至是在孩子沒有同意的情況下。例如，醫生可能建議切除睪丸「預防癌症」，或進行「性器官矯正手術」讓身體更符合社會期待。國際人權組織譴責這些做法為「醫療暴力」。關鍵問題是：這些手術是「必要」還是「管制性的」？誰應該做決定？`
  },
  informed_consent: {
    title: '知情同意：醫療決定前必須清楚交流',
    content: `「知情同意」是醫療倫理的基本原則。意思是：醫療人員要清楚解釋（1）要做什麼程序、（2）為什麼要做、（3）有什麼風險、（4）有什麼替代方案、（5）如果不做會怎樣。父母與患者有權理解這些信息，並有權同意、拒絕或要求時間考慮。對於影響深遠的身體決定（如手術），知情同意尤其重要。可惜，許多醫療人員對雙性人兒童的做法忽視了這個原則。`
  },
  watchful_waiting: {
    title: '觀察與等待：有時候暫時不做決定是更好的選擇',
    content: `對於某些身體狀況，醫學上的「標準做法」是立即干預。但越來越多的倡議者與醫療專家提出：有些時候，暫時觀察，等待當事人成長到足夠年紀自己參與決定，可能是更尊重人權的做法。例如，對於某些雙性人狀況，不必急著在嬰兒期做手術，而是等到孩子長大、理解自己的身體與認同後，再由當事人自己決定是否需要醫療介入。這被稱為「生殖自決權」或「自決醫療」。`
  },
  gender_socialization: {
    title: '性別社會化：從衣服、玩具到行為期待',
    content: `從出生那一刻開始，社會就根據指定性別對孩子進行「性別社會化」。藍色還是粉紅色、洋娃娃還是汽車、裙子還是褲子、溫柔還是勇敢——這些看似小事的選擇實際上在傳達信息：「你應該是怎樣的人」。大多數孩子會內化這些期待，發展出與指定性別相符的性別認同（這叫做「順性別」）。但有些孩子會對這些期待感到困惑或抗拒，這也是正常且健康的。性別社會化是社會建構，而非生物決定。`
  },
  puberty_diversity: {
    title: '青春期的多樣性：沒有「標準」的身體發育時間表',
    content: `青春期是生物性特徵顯現的關鍵期。但沒有「一個」標準的時間表。有人很早開始（8-9 歲），有人較晚（13-15 歲），都是正常。而且，第二性徵的發育順序與速度也因人而異。月經來臨的時間、乳房發育程度、陰毛與鬍鬚的分佈、嗓音變化——每個人的組合都獨特。社會對「標準男性身體」與「標準女性身體」的想像，使得任何「不符」的青春期發育都被看作異常。但實際上，這些變異都在正常人類多樣性的範圍內。`
  },
  intersex_experience: {
    title: '雙性人的青春期：身體在「出軌」',
    content: `對於某些雙性人，青春期會帶來意外的發現。例如，一個被指定為男性且童年期接受了手術的人，可能在青春期發現體內仍有卵巢組織，開始月經。或者，一個被指定為女性的人，發現自己長出了鬍鬚與喉結。這些時刻充滿困惑：「醫生說我是女孩，但我的身體在說別的。」許多雙性人在青春期才真正開始理解自己的身體不是「典型」的，這可能帶來釋然（「終於明白了」）或創傷（「為什麼沒有人告訴我？」）。`
  },
  medical_trauma: {
    title: '醫療創傷：未經同意的手術如何影響一生',
    content: `許多雙性人在幼年時期因為醫生或父母的決定而經歷手術或激素治療，卻沒有被充分知會或徵求意見。當他們長大後發現真相——「我的身體被改變了」、「醫生為了『預防』什麼切除了我的生殖器官」——許多人經歷深刻的創傷、憤怒與背叛感。他們可能問：「如果我當時知道自己是雙性人，我會同意這個決定嗎？」醫療暴力的後遺症不只是生理上的，更多是心理與信任上的創傷。`
  },
  peer_support: {
    title: '同儕支持的力量：「不是只有我」',
    content: `當一個青少年在身體或認同上感到困惑或孤立時，發現有其他人有相似經驗可以產生巨大的心理力量。「不是只有我」的認知能有效降低孤立感與羞恥感。無論是透過線上社群、同儕支持小組，或者就是與一位朋友的坦誠對話，分享經驗都能帶來解脫。同時，在安全的社群中聽到他人的故事與應對策略，也能幫助個人發展自己的因應方式。同儕支持往往比「專業意見」更能在情感上產生共鳴。`
  },
  identity_formation: {
    title: '性別認同是在探索與反思中形成的',
    content: `你對自己性別的理解，不是在出生時就被鎖定的。它隨著成長、經歷、自我反思而演變。有些人的認同與指定性別一致（順性別），有些人不一致（跨性別、非二元等）；有些人對性別的認識流動或複雜。所有這些都是自然人性發展的一部分。重要的不是「你的認同是什麼」，而是「你是否被允許自由地探索與表達」。許多人需要時間、安全的環境與支持，才能發展出真實的性別認同。`
  },
  gender_norms: {
    title: '性別規範是社會建構，而非生物必然',
    content: `「男生玩藍色玩具，女生玩粉紅色」、「男性應該堅強，女性應該溫柔」——這類規範在不同文化和時代有不同的內容，甚至完全相反。它們不是來自生物學，而是從社會習俗與權力結構演變而來。質疑這些規範、跨越這些界線，正是批判思維的表現。既然規範是建構的，就可以改變。允許人們在不同場景有不同的表達，而不受性別二元框架限制，社會會更健康。`
  },
  gender_expression: {
    title: '性別表達是流動的，取決於環境和個人選擇',
    content: `你如何穿著、說話、行動的方式是「性別表達」——這與性別認同和生物性是分開的概念。同一個人可能在不同地點有不同的表達方式，這不是「虛假」，而是適應環境的合理選擇。有些人在工作和家庭中的表達不同，在學校和朋友圈中也不同。這樣的彈性是正常的，有時是必要的自我保護。性別表達是流動的、多面向的，反映了個人在不同社會環境中的需求與選擇。`
  },
  privacy_consent: {
    title: '隱私與同意：你的身體資訊是你的權利',
    content: `沒有人有權要求知道你的染色體、性器官細節、月經情況，或任何身體私密資訊——即使是親戚、朋友，甚至醫療人員，除非你同意。在醫療場景中，「知情同意」是基本倫理：醫生要解釋目的、方式與風險，你有權同意、拒絕、或要求第二意見。捍衛自己的隱私邊界，不是隱瞞，而是對自己的尊重。這尤其重要於雙性人群體——許多人成長中不斷被要求暴露與解釋自己的身體。`
  },
  selective_disclosure: {
    title: '在不同環境選擇性地揭露是一種智慧策略',
    content: `你不需要在每個場景都揭露所有關於身體和身份的真相。工作時可能只說「我需要這個合理便利」，不解釋原因；醫療場景要完全誠實以獲得最佳照護；親密關係中可能需要更多信任和開放。這些層級化的溝通不是謊言，而是根據環境調整資訊邊界——成熟人際關係與自我保護的一部分。`
  },
  bodily_autonomy: {
    title: '身體自主權：決定權屬於你',
    content: `完全隱瞞或完全公開都有代價。有些人選擇完全透明，因為這帶來解脫和認可；有些人需要保留隱私以維持安全。沒有「對的做法」——只有對你個人情境最適合的做法。關鍵是：這個選擇是你的，基於你對自己的理解，而非被迫或被期待。身體自主權就是有能力自己決定關於你的身體的事。這對雙性人尤其關鍵——因為許多人幼年時的身體決定是由他人做出的。`
  },
  medical_privacy: {
    title: '醫療隱私的邊界在「同意」',
    content: `醫療人員有義務對你的個人資訊保密，但也需要知道必要的身體信息以提供最佳照護。重點是「知情同意」：你了解他們為何需要這些資訊、資訊如何被使用、你有權提出疑慮。如果醫生的詢問讓你不適，可以說「我不想回答」或「為什麼你需要知道這個」。你的身體，你的規則。特別地，醫療人員不應該未經同意就對他人的身體進行檢查、拍照或轉介其他專業人士。`
  },
  acceptance: {
    title: '接納不等於放棄，而是停止內鬥',
    content: `與其不斷抗拒或悔恨自己的現況，有些人選擇深呼吸、原諒自己的不完美，並在當下的現實中找到意義。這不是被動投降，而是主動選擇把能量用在「與自己和解」而非「改變不能改的」。對於因童年醫療決定而無法改變的身體狀況，接納可能是通往心理平靜的唯一路徑。很多人發現，這種心態的轉變帶來意外的平靜與力量。`
  },
  self_determination: {
    title: '自決：改變任何你有權改變的部分',
    content: `如果現狀不符合你的認同與需求，你可以尋求改變：法律上改變性別標記、醫療上改變身體特徵、社交上改變名字和表達。這些改變可能面臨制度阻力或社會偏見，但你有權嘗試。重要的是這些決定源於內在需求，而非外在壓力，且你充分了解過程與後果。對於雙性人來說，自決可能意味著要求醫療系統承認幼年的醫療決定是否應該被保留或改變。`
  },
  solidarity: {
    title: '以故事連結他人是改變的起點',
    content: `當你分享你的故事——即使含著淚、尷尬、或憤怒——其他在掙扎中的人會看到自己的反射，感到被看見。集體的故事敘述可以改變文化、政策、醫療實踐。無論你最後的選擇是什麼，你的經驗都有價值。而聆聽與傳播這些故事，是每個人都能參與的社會改變行動。許多重要的醫療與法律改革源於倡議者勇敢地分享他們因醫療暴力而受傷的經歷。`
  },
  professional_support: {
    title: '專業支持不是「有問題」的標籤，而是智慧的求助',
    content: `心理治療師、醫生、社工、法律顧問——這些專業人士受過訓練，能幫助你在複雜的決定中理清思路、評估選項、規劃行動。尋求專業支持不是因為你「壞掉了」，而是因為某些決定超出自己能處理的範圍，需要有經驗的人同行。這是力量和自知的表現。對於因醫療決定而有創傷的雙性人，心理治療可能特別有幫助。`
  },
  medical_coercion: {
    title: '醫療強制：當醫生用恐嚇控制決定',
    content: `有些醫生會用嚇人的語言來推動家長進行醫療程序：「如果不做，孩子會患癌症」、「會變得心理異常」、「會在社會上受歧視」。這種做法叫「醫療強制」。問題是：這些威脅往往過度誇大了風險，而忽視了手術本身的風險和創傷。國際醫學組織（如美國醫學會）現已認可：對雙性人兒童進行非必要的手術是倫理違反。當醫生用恐嚇而非清楚的知情同意說話時，那不是為了患者著想，而是在濫用權力。`
  },
  bullying_trauma: {
    title: '霸凌創傷：被迫揭露後的社會傷害',
    content: `如果身體的秘密在學校或家庭被暴露，會導致霸凌。被同學取笑、被教師污名化、被親戚議論，這些都造成深刻的心理創傷。霸凌不只是「言語傷害」——它影響安全感、自我價值、對人際關係的信任。而且，這種創傷往往被家人或學校輕視（「他們只是在開玩笑」、「你要學會適應」）。實際上，長期的同儕霸凌會導致焦慮症、抑鬱症、自傷、自殺傾向。被迫揭露身體秘密後的霸凌，是造成雙性人心理健康問題的重要因素。`
  },
  relational_abuse: {
    title: '關係中的虐待：用隱私作為控制的武器',
    content: `當親密伴侶、家人或同事發現你的「秘密」後，有些人會用這個來控制你：威脅洩露、要求你「正常化」、或用羞恥和罪惡感來操縱。這是一種形式的虐待——利用你對隱私的需求來施加權力。這種虐待是危險的，因為它（1）加深了你對身體的恥辱感，（2）讓你更孤立，（3）使你難以尋求幫助（因為涉及隱私威脅）。關係中的虐待需要專業支持來脫離——無論是心理諮商或法律途徑。`
  },
  crisis_point: {
    title: '危機點：當累積的創傷變成絕望',
    content: `多次的創傷、被拒絕、被控制、被隱形——這些可以累積到讓人放棄的臨界點。到了這裡，人可能陷入自傷、自殺念頭、或完全的社會撤離。這不是「懦弱」，也不是「做不夠」。這是長期創傷的後果。但這個點也是轉機：它迫使你承認「現在情況很糟，我需要幫助」。如果你或認識的人在危機中，請尋求幫助。生命熱線（1925）、安心專線（1925）、勵馨基金會、台灣同志諮詢熱線——都有訓練過的人願意傾聽。危機不是終點；它是求救的信號。`
  },
  forced_assimilation: {
    title: '被迫同化：為了融入而否認自我',
    content: `「正常化」和「同化」是社會壓力的核心。當被告知「你的身體/身份不符合規範，所以你必須改變」時，許多人選擇徹底改造自己——改變外表、壓抑慾望、隱藏特徵，假裝成「應該」的樣子。問題是：這樣做會導致持久的心理創傷。你學會了否認自己，變成一個為了迎合他人期待而活的人。這不是自我接納，而是自我背叛。即使表面上「融入」了，內心的分裂和壓抑會累積成嚴重的心理健康問題。真正的健康來自自我接納，而非強制同化。`
  }
};

// 結局定義
const ENDINGS = [
  {
    id: 'catastrophic_loss',
    name: '支離破碎',
    condition: (scores) => scores.stress > 85 && scores.safety < 20 && scores.connection < 20,
    narrative: `在多次創傷的累積下，你已經不知道自己是誰了。信任破裂了——對醫療系統、對父母、對社會、對自己。你的身體成為了一個戰場，而戰爭的傷痕無處不在。孤立感壓倒了一切，甚至基本的自我照顧都成為了奢侈。你需要幫助，而這是最重要的一步。如果你正在經歷這樣的絕望，請記住：這不是你的錯，而且幫助是存在的——即使現在看不見。`,
    endingColor: 'bg-red-100'
  },
  {
    id: 'numbing_survival',
    name: '麻木的生存',
    condition: (scores) => scores.stress > 80 && scores.understanding < 30 && scores.connection < 30,
    narrative: `你還活著，但你已經停止了感受。每一天都一樣，每一個決定都沒有區別。你學會了如何在極端的痛苦中變得麻木——這是一種生存機制，卻也是一種死亡。你無法相信改變是可能的，因為希望已經被打碎太多次。這種狀態是可以改變的。但改變必須從承認「現在情況很糟」開始——而這需要勇氣。`,
    endingColor: 'bg-gray-200'
  },
  {
    id: 'systemic_erasure',
    name: '制度性抹滅',
    condition: (scores) => scores.safety < 25 && scores.understanding < 25,
    narrative: `你成為了制度的隱形人。沒有人聽見你、看見你、相信你。醫療系統將你當作問題，而不是人。家庭將你當作秘密。社會將你當作不存在。你被迫隱藏、被迫沉默、被迫小型化。每一次的壓抑都讓你更加消失。但即使在黑暗中，你的故事也重要。被看不見，不代表不存在。`,
    endingColor: 'bg-purple-300'
  },
  {
    id: 'integrated',
    name: '和諧共處',
    condition: (scores) => scores.understanding > 60 && scores.safety > 50 && scores.connection > 50 && scores.stress < 60,
    narrative: `你走出了內在的迷茫與外界的噪音。也許身體還是複雜的，社會期待還是存在，但你已經找到了一個與自己和諧相處的方式。你知道自己是誰——不是完全確定，而是足夠了解。朋友、家人或醫療人員對你的支持，讓你可以自信地呼吸。你的故事沒有完全「解決」，卻在進行中達到了平衡。這個平衡會一直演變，但你已經不害怕變化了。`,
    endingColor: 'bg-green-50'
  },
  {
    id: 'awakening',
    name: '覺醒時刻',
    condition: (scores) => scores.understanding > 75 && scores.connection > 40,
    narrative: `你突然明白了：所有的羞恥、困惑、內疚——都不是來自自己，而是社會的期待在作祟。這個頓悟很痛，但也很解放。你開始質疑從前接受的一切，重新認識自己的身體、認同、和在世界中的位置。也許這會帶來新的挑戰——改變永遠有代價——但至少現在你是清醒的、自主的。你準備好為真實的自己發聲了。`,
    endingColor: 'bg-yellow-50'
  },
  {
    id: 'resilient_solitude',
    name: '堅強的獨行者',
    condition: (scores) => scores.stress > 70 && scores.understanding > 40 && scores.connection < 40,
    narrative: `也許周圍人不理解，也許你感到孤立。但你已經找到了內在的韌性。你獨自承載著自己的故事，不靠別人的肯定而活著。這種獨立可能源於傷痛，但它也讓你強大。你知道如何在逆境中生存，如何保護自己。現在的課題是：如何在保持邊界的同時，允許他人進入？如何既堅強又脆弱？`,
    endingColor: 'bg-orange-50'
  },
  {
    id: 'community_anchor',
    name: '社群的燈塔',
    condition: (scores) => scores.connection > 75 && scores.understanding > 50,
    narrative: `你成為了同齡人、朋友、甚至陌生人的參考點。因為你願意分享、願意傾聽、願意見證他人的故事，所以人們被吸引向你。你的故事——無論多複雜、多未竟——成為了他人的力量之源。也許你還在探索自己的身份，但你已經在幫助別人找到方向。這是一個美麗的角色：你不是完人，卻是他人的燈塔。`,
    endingColor: 'bg-blue-50'
  },
  {
    id: 'medical_informed',
    name: '知情與自主',
    condition: (scores) => scores.understanding > 65 && scores.safety > 60,
    narrative: `你成為了自己健康的主人。你懂得如何與醫療系統溝通、如何保護隱私、如何在知情同意的基礎上做決定。也許這個過程充滿了難度和尷尬，但你已經學會了如何為自己倡導。無論是求醫、改變身體、或保留現狀，你的決定都來自充分的理解與真實的同意。這種主動性，是對自己最大的尊重。`,
    endingColor: 'bg-purple-50'
  },
  {
    id: 'uncertain_growth',
    name: '不確定中的成長',
    condition: (scores) => true, // 預設結局
    narrative: `你的故事沒有確定的結局——就像真實的人生一樣。也許你還在尋找答案，也許答案本身在變動。這不是失敗；這是誠實。你已經問了更深層的問題、聽見了不同的聲音、看到了自己與他人的複雜性。成長就發生在這個「還不知道」的空間裡。繼續走，允許自己改變想法，尊重過程本身。`,
    endingColor: 'bg-gray-50'
  }
];

/**
 * ==================== 遊戲狀態管理 ====================
 */

const initialState = {
  gameScreen: 'title', // 'title', 'character_select', 'playing', 'ending', 'credits'
  bodyTrait: null,
  socialContext: null,
  currentChapter: 0,
  scores: { understanding: 50, safety: 50, connection: 50, stress: 50 },
  unlockedCards: [],
  choiceHistory: [],
  currentEnding: null,
  allRounds: [] // 用於記錄歷次遊戲輪次
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'START_NEW_GAME': {
      const bodyTrait = BODY_TRAITS[Math.floor(Math.random() * BODY_TRAITS.length)];
      const socialContext = SOCIAL_CONTEXTS[Math.floor(Math.random() * SOCIAL_CONTEXTS.length)];
      return {
        ...initialState,
        gameScreen: 'character_select',
        bodyTrait,
        socialContext,
        scores: {
          understanding: 50,
          safety: 50 + socialContext.stressBonus,
          connection: 50,
          stress: 50 - socialContext.stressBonus
        }
      };
    }
    case 'CONFIRM_CHARACTER':
      return {
        ...state,
        gameScreen: 'playing',
        currentChapter: 0
      };
    case 'MAKE_CHOICE': {
      const choice = action.payload;
      const newScores = {
        understanding: Math.max(0, Math.min(100, state.scores.understanding + choice.impact.understanding)),
        safety: Math.max(0, Math.min(100, state.scores.safety + choice.impact.safety)),
        connection: Math.max(0, Math.min(100, state.scores.connection + choice.impact.connection)),
        stress: Math.max(0, Math.min(100, state.scores.stress + choice.impact.stress))
      };

      const newUnlockedCards = state.unlockedCards.includes(choice.knowledge)
        ? state.unlockedCards
        : [...state.unlockedCards, choice.knowledge];

      const newChoiceHistory = [
        ...state.choiceHistory,
        {
          chapter: state.currentChapter,
          choiceText: choice.text,
          impact: choice.impact
        }
      ];

      if (state.currentChapter < CHAPTERS.length - 1) {
        return {
          ...state,
          currentChapter: state.currentChapter + 1,
          scores: newScores,
          unlockedCards: newUnlockedCards,
          choiceHistory: newChoiceHistory
        };
      } else {
        // 遊戲結束，計算結局
        const ending = ENDINGS.find(e => e.condition(newScores)) || ENDINGS[ENDINGS.length - 1];
        const roundData = {
          bodyTrait: state.bodyTrait,
          socialContext: state.socialContext,
          finalScores: newScores,
          ending: ending,
          unlockedCards: newUnlockedCards
        };
        return {
          ...state,
          currentChapter: state.currentChapter + 1,
          scores: newScores,
          unlockedCards: newUnlockedCards,
          choiceHistory: newChoiceHistory,
          gameScreen: 'ending',
          currentEnding: ending,
          allRounds: [...state.allRounds, roundData]
        };
      }
    }
    case 'RESTART_GAME':
      return {
        ...initialState,
        allRounds: state.allRounds
      };
    default:
      return state;
  }
}

/**
 * ==================== React 組件 ====================
 */

export default function LifeRestartGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [viewingCard, setViewingCard] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // 當前章節
  const currentChapterData = CHAPTERS[state.currentChapter];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans'>
      {/* 內容提醒橫幅 */}
      <div className='bg-amber-100 border-b border-amber-300 p-3 text-center text-sm text-amber-900'>
        ⚠️ 本遊戲探討身體、認同與制度議題。內容尊重隱私，不涉及露骨描寫。如感到不適，可隨時離開。
      </div>

      {/* 標題畫面 */}
      {state.gameScreen === 'title' && (
        <TitleScreen dispatch={dispatch} />
      )}

      {/* 角色選擇畫面 */}
      {state.gameScreen === 'character_select' && (
        <CharacterSelectScreen state={state} dispatch={dispatch} />
      )}

      {/* 遊戲進行畫面 */}
      {state.gameScreen === 'playing' && currentChapterData && (
        <PlayingScreen
          state={state}
          dispatch={dispatch}
          chapter={currentChapterData}
          onViewCard={setViewingCard}
          onViewHistory={() => setShowHistory(!showHistory)}
          showHistory={showHistory}
        />
      )}

      {/* 結局畫面 */}
      {state.gameScreen === 'ending' && state.currentEnding && (
        <EndingScreen
          ending={state.currentEnding}
          scores={state.scores}
          unlockedCards={state.unlockedCards}
          choiceHistory={state.choiceHistory}
          dispatch={dispatch}
          onViewCard={setViewingCard}
        />
      )}

      {/* 知識卡彈窗 */}
      {viewingCard && (
        <KnowledgeCardModal
          cardId={viewingCard}
          onClose={() => setViewingCard(null)}
        />
      )}
    </div>
  );
}

/**
 * 標題畫面
 */
function TitleScreen({ dispatch }) {
  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center px-4'>
      <div className='max-w-2xl text-center'>
        <div className='mb-8 animate-fade-in'>
          <h1 className='text-6xl md:text-7xl font-black mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent'>
            人生重開機
          </h1>
          <div className='h-1 w-24 bg-gradient-to-r from-pink-400 to-blue-400 mx-auto rounded-full'></div>
        </div>
        
        <p className='text-2xl text-purple-300 mb-6 font-light leading-relaxed'>
          每一次選擇，都定義了你的人生
        </p>
        <p className='text-lg text-slate-400 mb-12 leading-relaxed'>
          在多輪人生中做決定，探索性別、生物性徵與性別認同的複雜故事。
          每個時刻都是一個轉折點。
        </p>

        <div className='space-y-4 mb-12'>
          <button
            onClick={() => dispatch({ type: 'START_NEW_GAME' })}
            className='w-full py-4 px-8 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-bold text-lg hover:shadow-2xl hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg'
          >
            開始一段新的人生 →
          </button>
        </div>

        <div className='bg-slate-800 bg-opacity-60 rounded-xl p-8 shadow-xl border border-indigo-500 border-opacity-30 backdrop-blur'>
          <h3 className='font-bold text-xl mb-6 text-purple-300'>✨ 遊戲指南</h3>
          <ul className='text-sm text-slate-300 space-y-3 text-left'>
            <li className='flex items-start gap-3'>
              <span className='text-pink-400 font-bold text-lg'>1</span>
              <span>每局遊戲會給你一個獨特的「身體」與「環境」，塑造你的起點</span>
            </li>
            <li className='flex items-start gap-3'>
              <span className='text-purple-400 font-bold text-lg'>2</span>
              <span>在 5 個人生時刻中做出選擇，每個決定都會影響你的旅程</span>
            </li>
            <li className='flex items-start gap-3'>
              <span className='text-blue-400 font-bold text-lg'>3</span>
              <span>每個選擇都能解鎖知識卡，深入理解性別與身體的複雜性</span>
            </li>
            <li className='flex items-start gap-3'>
              <span className='text-indigo-400 font-bold text-lg'>4</span>
              <span>最終你將抵達一個獨特的結局，看見自己的故事反映</span>
            </li>
          </ul>
        </div>

        <p className='text-xs text-slate-500 mt-10'>
          ⚠️ 本遊戲涉及身體認同與醫療決策的敏感議題。以尊重與無批判的方式呈現。
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * 角色選擇畫面
 */
function CharacterSelectScreen({ state, dispatch }) {
  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8'>
      <div className='max-w-5xl mx-auto'>
        {/* 標題區 */}
        <div className='text-center mb-12'>
          <h2 className='text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent'>
            你的人生參數
          </h2>
          <p className='text-lg text-slate-300 font-light'>這一輪遊戲，你被賦予的身體與環境如下</p>
        </div>

        <div className='grid md:grid-cols-2 gap-8 mb-10'>
          {/* 身體設定卡 - 視覺化小說風格 */}
          <div className='bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 shadow-2xl border-2 border-gradient-to-br from-pink-500 to-purple-500 relative overflow-hidden group hover:shadow-2xl transition-all duration-300'>
            <div className='absolute top-0 right-0 w-40 h-40 bg-pink-500 opacity-5 rounded-full -mr-20 -mt-20 group-hover:opacity-10 transition-opacity'></div>
            <div className='relative z-10'>
              <div className='flex items-center gap-3 mb-4'>
                <span className='text-3xl'>🧬</span>
                <h3 className='text-2xl font-bold text-pink-300'>身體設定</h3>
              </div>
              <p className='text-3xl font-bold text-white mb-3'>{state.bodyTrait.name}</p>
              <p className='text-slate-300 mb-4 leading-relaxed font-light'>{state.bodyTrait.description}</p>
              {state.bodyTrait.detail && (
                <div className='border-t border-slate-700 pt-3'>
                  <p className='text-sm text-slate-400 italic'>{state.bodyTrait.detail}</p>
                </div>
              )}
            </div>
          </div>

          {/* 社會情境卡 - 視覺化小說風格 */}
          <div className='bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 shadow-2xl border-2 border-gradient-to-br from-indigo-500 to-cyan-500 relative overflow-hidden group hover:shadow-2xl transition-all duration-300'>
            <div className='absolute top-0 right-0 w-40 h-40 bg-indigo-500 opacity-5 rounded-full -mr-20 -mt-20 group-hover:opacity-10 transition-opacity'></div>
            <div className='relative z-10'>
              <div className='flex items-center gap-3 mb-4'>
                <span className='text-3xl'>{state.socialContext.icon}</span>
                <h3 className='text-2xl font-bold text-indigo-300'>社會情境</h3>
              </div>
              <p className='text-3xl font-bold text-white mb-3'>{state.socialContext.name}</p>
              <p className='text-slate-300 leading-relaxed font-light'>{state.socialContext.description}</p>
              
              {/* 選擇自由度指示 */}
              <div className='mt-4 pt-4 border-t border-slate-700'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-xs font-bold text-slate-400'>選擇自由度</span>
                  <div className='flex-1 bg-slate-700 rounded-full h-2 overflow-hidden'>
                    <div
                      className='bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full'
                      style={{ width: `${(state.socialContext.choiceCount / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className='text-xs text-slate-400'>
                  {state.socialContext.choiceCount === 1 && '🔴 極度限制：幾乎沒有選擇'}
                  {state.socialContext.choiceCount === 2 && '🟠 嚴重限制：選擇很有限'}
                  {state.socialContext.choiceCount === 4 && '🟡 適度限制：相對較多選擇'}
                  {state.socialContext.choiceCount === 5 && '🟢 高度自由：所有選項都可得'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 開局指標 - 精簡版 */}
        <div className='bg-slate-800 bg-opacity-50 rounded-lg p-6 mb-10 border border-slate-700'>
          <h3 className='font-bold text-lg text-slate-200 mb-6 uppercase tracking-wider'>開局指標</h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            <ScoreBadgeCompact label='理解' value={state.scores.understanding} color='indigo' />
            <ScoreBadgeCompact label='安全' value={state.scores.safety} color='green' />
            <ScoreBadgeCompact label='連結' value={state.scores.connection} color='pink' />
            <ScoreBadgeCompact label='壓力' value={state.scores.stress} color='red' />
          </div>
        </div>

        {/* 確認按鈕 */}
        <div className='flex gap-4 justify-center'>
          <button
            onClick={() => dispatch({ type: 'RESTART_GAME' })}
            className='px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition duration-300 border border-slate-600 hover:border-slate-500'
          >
            重新抽卡 🔄
          </button>
          <button
            onClick={() => dispatch({ type: 'CONFIRM_CHARACTER' })}
            className='px-10 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300'
          >
            開始這一輪人生 →
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 遊戲進行畫面 - 視覺化小說風格
 */
function PlayingScreen({ state, dispatch, chapter, onViewCard, onViewHistory, showHistory }) {
  const chapterPercentage = (chapter.number / 5) * 100;
  
  // 當章節改變時自動滾動到頂部
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chapter.number]);
  
  // 根據社會情境和選項優先級篩選可用選項
  const getAvailableChoices = () => {
    const maxChoices = state.socialContext?.choiceCount || 5;
    
    // 邏輯：在受限環境中，最壞選項應該被強制包含
    // 代表社會壓力迫使你陷入絕境
    if (maxChoices === 1) {
      // 只顯示一個選項：強制選擇最壞的結果（無逃脫空間）
      const worstChoice = chapter.choices.find(c => c.id.endsWith('_5'));
      return worstChoice ? [worstChoice] : chapter.choices.slice(0, 1);
    } else if (maxChoices === 2) {
      // 只顯示兩個選項：在壞和更壞之間選擇
      const worstChoice = chapter.choices.find(c => c.id.endsWith('_5'));
      const betterChoice = chapter.choices[0];
      return [betterChoice, worstChoice || chapter.choices[1]];
    } else if (maxChoices === 4) {
      // 顯示四個選項：排除最壞的
      return chapter.choices.filter(choice => !choice.id.endsWith('_5'));
    } else {
      // 顯示全部（choiceCount === 5）
      return chapter.choices;
    }
  };
  
  // 隨機打亂選項順序，讓玩家無法輕易識別最壞選項
  const shuffleChoices = (choices) => {
    const shuffled = [...choices];
    // Fisher-Yates 算法
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const availableChoices = shuffleChoices(getAvailableChoices());
  
  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 pb-20'>
      <div className='max-w-4xl mx-auto'>
        {/* 進度條 */}
        <div className='mb-10'>
          <div className='flex justify-between items-center mb-3'>
            <h2 className='text-3xl md:text-4xl font-bold text-white'>
              <span className='text-purple-400'>第 {chapter.number} 時刻</span>：{chapter.name}
            </h2>
            <button
              onClick={onViewHistory}
              className='text-sm px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition'
            >
              {showHistory ? '隱藏' : '查看'}紀錄
            </button>
          </div>
          
          {/* 進度條視覺 */}
          <div className='w-full bg-slate-700 rounded-full h-3 overflow-hidden shadow-lg'>
            <div
              className='bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 h-3 rounded-full transition-all duration-700 shadow-lg'
              style={{ width: `${chapterPercentage}%` }}
            ></div>
          </div>
          <p className='text-xs text-slate-400 mt-2 text-right'>{chapter.number} / 5</p>
        </div>

        {/* 章節敘述 - 大型視覺化小說風格 */}
        <div className='mb-8'>
          <div className='bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 shadow-2xl border-l-4 border-purple-500 relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-5 rounded-full -mr-16 -mt-16'></div>
            <p className='text-xl md:text-2xl text-slate-100 leading-relaxed font-light relative z-10'>
              {chapter.narrative}
            </p>
          </div>
        </div>

        {/* 指標展示 - 精簡版 */}
        <div className='mb-8 bg-slate-800 bg-opacity-50 rounded-lg p-4 border border-slate-700'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            <ScoreBadgeCompact label='理解' value={state.scores.understanding} color='indigo' />
            <ScoreBadgeCompact label='安全' value={state.scores.safety} color='green' />
            <ScoreBadgeCompact label='連結' value={state.scores.connection} color='pink' />
            <ScoreBadgeCompact label='壓力' value={state.scores.stress} color='red' />
          </div>
        </div>

        {/* 社會情境提示 */}
        {state.socialContext && availableChoices.length < chapter.choices.length && (
          <div className='mb-8 p-4 bg-slate-800 border-l-4 border-red-500 rounded-lg'>
            <p className='text-sm text-slate-300'>
              <span className='text-red-400 font-bold'>⚠️ 社會限制：</span>
              你所處的環境限制了你的選擇自由度。{state.socialContext.name}的環境中，你只有 <span className='font-bold text-red-300'>{availableChoices.length}</span> 個真正的選項。
            </p>
          </div>
        )}

        {/* 選擇按鈕 */}
        <div className='space-y-4 mb-8'>
          <p className='text-slate-400 text-sm uppercase tracking-wider font-bold mb-4'>
            你的選擇 ({availableChoices.length}/{chapter.choices.length})
          </p>
          {availableChoices.map((choice) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              onSelect={() => dispatch({ type: 'MAKE_CHOICE', payload: choice })}
              onViewCard={() => onViewCard(choice.knowledge)}
            />
          ))}
        </div>

        {/* 選擇紀錄 */}
        {showHistory && (
          <ChoiceHistoryPanel history={state.choiceHistory} />
        )}
      </div>
    </div>
  );
}

/**
 * 選擇按鈕元件 - 視覺化小說風格
 */
function ChoiceButton({ choice, onSelect, onViewCard }) {
  return (
    <button
      onClick={onSelect}
      className='w-full text-left group'
    >
      <div className='bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl px-6 py-4 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-indigo-400 hover:border-indigo-500 hover:from-indigo-900 hover:to-indigo-800 relative overflow-hidden'
      >
        {/* 背景光暈效果 */}
        <div className='absolute inset-0 bg-gradient-to-r from-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300'></div>
        
        {/* 內容 */}
        <div className='relative z-10 flex justify-between items-start gap-4'>
          <div className='flex-1'>
            <p className='text-lg font-bold leading-relaxed group-hover:text-indigo-200 transition'>
              {choice.text}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewCard();
            }}
            className='flex-shrink-0 px-3 py-1 text-sm bg-amber-500 bg-opacity-20 text-amber-300 rounded-full hover:bg-opacity-40 transition border border-amber-400 hover:border-amber-300 font-semibold'
            title='查看相關知識卡'
          >
            💡
          </button>
        </div>
      </div>
    </button>
  );
}

/**
 * 選擇紀錄面板
 */
function ChoiceHistoryPanel({ history }) {
  return (
    <div className='bg-slate-800 bg-opacity-50 rounded-lg p-6 border border-slate-700'>
      <h3 className='font-bold text-lg text-slate-200 mb-4 uppercase tracking-wider'>🎬 選擇紀錄</h3>
      <div className='space-y-3 max-h-64 overflow-y-auto'>
        {history.map((item, idx) => (
          <div key={idx} className='text-sm text-slate-300 pb-3 border-b border-slate-700 last:border-0'>
            <span className='font-semibold text-purple-400'>第 {item.chapter + 1} 時刻</span>
            <p className='mt-1 text-slate-400'>{item.choiceText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 結局畫面
 */
function EndingScreen({ ending, scores, unlockedCards, choiceHistory, dispatch, onViewCard }) {
  const radarData = [
    { label: '理解', value: scores.understanding },
    { label: '安全', value: scores.safety },
    { label: '連結', value: scores.connection },
    { label: '壓力', value: scores.stress }
  ];

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 pb-20'>
      <div className='max-w-4xl mx-auto'>
        {/* 結局標題 - 電影般的呈現 */}
        <div className='text-center mb-16'>
          <h2 className='text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight'>
            {ending.name}
          </h2>
          <div className='w-24 h-1 bg-gradient-to-r from-yellow-400 to-purple-400 mx-auto mb-8'></div>
        </div>

        {/* 結局敘述 */}
        <div className='bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 shadow-2xl border-l-4 border-purple-500 mb-12 relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-48 h-48 bg-purple-500 opacity-5 rounded-full -mr-24 -mt-24'></div>
          <p className='text-xl md:text-2xl text-slate-100 leading-relaxed font-light relative z-10'>
            {ending.narrative}
          </p>
        </div>

        {/* 最終指標 - 視覺化展示 */}
        <div className='bg-slate-800 bg-opacity-50 rounded-lg p-8 mb-12 border border-slate-700'>
          <h3 className='font-bold text-2xl mb-8 text-slate-200 uppercase tracking-wider'>你的最終狀態</h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-8'>
            {radarData.map((item) => (
              <div key={item.label} className='text-center'>
                <div className='text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-2'>{item.value}</div>
                <div className='text-sm text-slate-400 uppercase tracking-wide font-semibold'>{item.label}</div>
              </div>
            ))}
          </div>

          {/* 雷達圖 */}
          <div className='pt-6 border-t border-slate-700 opacity-75'>
            <SimpleRadarChart data={radarData} />
          </div>
        </div>

        {/* 解鎖的知識卡 */}
        <div className='mb-12'>
          <h3 className='font-bold text-2xl mb-6 text-slate-200 uppercase tracking-wider'>
            🎓 本輪解鎖的知識卡 ({unlockedCards.length}/19)
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {unlockedCards.map((cardId) => {
              const card = KNOWLEDGE_CARDS[cardId];
              return card ? (
                <button
                  key={cardId}
                  onClick={() => onViewCard(cardId)}
                  className='text-left p-4 bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg border-l-4 border-indigo-500 hover:border-indigo-400 hover:shadow-lg transform hover:scale-105 transition-all duration-300'
                >
                  <p className='font-semibold text-indigo-300 mb-1'>{card.title}</p>
                  <p className='text-xs text-slate-400'>點擊查看詳細</p>
                </button>
              ) : null;
            })}
          </div>
        </div>

        {/* 選擇回顧 */}
        <div className='bg-slate-800 bg-opacity-50 rounded-lg p-6 mb-10 border border-slate-700'>
          <h3 className='font-bold text-lg text-slate-200 mb-4 uppercase tracking-wider'>📝 這一輪的選擇紀錄</h3>
          <div className='space-y-2 max-h-64 overflow-y-auto'>
            {choiceHistory.map((item, idx) => (
              <div key={idx} className='text-sm text-slate-300 pb-2 border-b border-slate-700 last:border-0'>
                <span className='font-semibold text-purple-400'>第 {item.chapter + 1} 時刻：</span> {item.choiceText}
              </div>
            ))}
          </div>
        </div>

        {/* 再來一局按鈕 */}
        <div className='flex justify-center'>
          <button
            onClick={() => dispatch({ type: 'RESTART_GAME' })}
            className='px-12 py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg'
          >
            開始新的人生 🔄
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 知識卡彈窗
 */
function KnowledgeCardModal({ cardId, onClose }) {
  const card = KNOWLEDGE_CARDS[cardId];
  if (!card) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm'>
      <div className='bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl max-w-xl w-full shadow-2xl border border-slate-700 transform transition-all duration-300 hover:shadow-3xl'>
        {/* 標題區 - 漸層背景 */}
        <div className='bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8 rounded-t-xl relative overflow-hidden'>
          <div className='absolute inset-0 opacity-10'>
            <div className='absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20'></div>
          </div>
          <h3 className='text-3xl font-bold relative z-10'>{card.title}</h3>
        </div>

        {/* 內容區 */}
        <div className='p-8'>
          <p className='text-lg text-slate-200 leading-relaxed font-light mb-4 whitespace-pre-wrap'>
            {card.content}
          </p>
          
          {/* 可視性指示 */}
          <div className='mt-6 pt-6 border-t border-slate-700'>
            <p className='text-xs text-slate-500 uppercase tracking-wider font-bold'>💡 知識卡 #{cardId}</p>
          </div>
        </div>

        {/* 按鈕區 */}
        <div className='px-8 py-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-800 bg-opacity-50 rounded-b-xl'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition duration-300 border border-slate-600 hover:border-slate-500'
          >
            關閉 ✕
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 精簡分數徽章 - 視覺化呈現
 */
function ScoreBadgeCompact({ label, value, color }) {
  const colors = {
    indigo: { bg: 'from-indigo-600 to-indigo-700', text: 'text-indigo-100' },
    green: { bg: 'from-green-600 to-green-700', text: 'text-green-100' },
    pink: { bg: 'from-pink-600 to-pink-700', text: 'text-pink-100' },
    red: { bg: 'from-red-600 to-red-700', text: 'text-red-100' },
  };
  
  const c = colors[color] || colors.indigo;
  const percentage = value;
  
  return (
    <div className='space-y-1'>
      <p className='text-xs font-bold text-slate-300 uppercase tracking-wide'>{label}</p>
      <div className='w-full bg-slate-700 rounded-full h-2 overflow-hidden'>
        <div
          className={`bg-gradient-to-r ${c.bg} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className='text-xs text-slate-400 text-right'>{value}</p>
    </div>
  );
}

/**
 * 分數徽章元件
 */
function ScoreBadge({ label, value, color }) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    green: 'bg-green-100 text-green-900 border-green-300',
    pink: 'bg-pink-100 text-pink-900 border-pink-300',
    red: 'bg-red-100 text-red-900 border-red-300'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-2 text-center`}>
      <div className='text-2xl font-bold'>{value}</div>
      <div className='text-xs font-semibold'>{label}</div>
    </div>
  );
}

/**
 * 簡易雷達圖 - 美化版本
 */
function SimpleRadarChart({ data }) {
  const maxValue = 100;
  const points = data.map((item, idx) => {
    const angle = (idx / data.length) * Math.PI * 2;
    const radius = (item.value / maxValue) * 80;
    const x = 100 + radius * Math.cos(angle - Math.PI / 2);
    const y = 100 + radius * Math.sin(angle - Math.PI / 2);
    return { ...item, x, y };
  });

  return (
    <svg width='280' height='280' viewBox='0 0 200 200' className='mx-auto' style={{ filter: 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.15))' }}>
      {/* 背景圓 - 深色主題 */}
      <circle cx='100' cy='100' r='80' fill='rgba(51, 65, 85, 0.3)' stroke='rgba(139, 92, 246, 0.3)' strokeWidth='1' />
      <circle cx='100' cy='100' r='60' fill='none' stroke='rgba(139, 92, 246, 0.2)' strokeWidth='1' />
      <circle cx='100' cy='100' r='40' fill='none' stroke='rgba(139, 92, 246, 0.15)' strokeWidth='1' />
      <circle cx='100' cy='100' r='20' fill='none' stroke='rgba(139, 92, 246, 0.1)' strokeWidth='1' />

      {/* 軸線 */}
      {points.map((point, idx) => (
        <line
          key={`line-${idx}`}
          x1='100'
          y1='100'
          x2={point.x}
          y2={point.y}
          stroke='rgba(139, 92, 246, 0.2)'
          strokeWidth='1'
        />
      ))}

      {/* 數據多邊形 - 漸層效果 */}
      <defs>
        <linearGradient id='radarGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='rgba(168, 85, 247, 0.4)' />
          <stop offset='50%' stopColor='rgba(99, 102, 241, 0.3)' />
          <stop offset='100%' stopColor='rgba(236, 72, 153, 0.4)' />
        </linearGradient>
      </defs>
      
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill='url(#radarGradient)'
        stroke='rgba(168, 85, 247, 0.8)'
        strokeWidth='2'
      />

      {/* 數據點 */}
      {points.map((point, idx) => (
        <circle
          key={`dot-${idx}`}
          cx={point.x}
          cy={point.y}
          r='4'
          fill='rgba(236, 72, 153, 0.8)'
          stroke='rgba(168, 85, 247, 1)'
          strokeWidth='1'
        />
      ))}

      {/* 標籤 */}
      {points.map((point, idx) => {
        const labelDistance = 1.2;
        const angle = (idx / data.length) * Math.PI * 2;
        const labelRadius = 90 * labelDistance;
        const labelX = 100 + labelRadius * Math.cos(angle - Math.PI / 2);
        const labelY = 100 + labelRadius * Math.sin(angle - Math.PI / 2);
        
        return (
          <text
            key={`text-${idx}`}
            x={labelX}
            y={labelY}
            textAnchor='middle'
            dy='0.3em'
            className='text-xs font-bold'
            fill='#cbd5e1'
            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
}