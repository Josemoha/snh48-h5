/* ============================================================================
   data_members_2026.js — 2026 年 1 月成员名单（「革新征程」线）
   ----------------------------------------------------------------------------
   【数据来源】snh48wiki.top（塞纳河档案）现役页/成员档案页/期生时间线，
              由调研代理按每人履历逐条重放至 2026-01-01 重建（2026-09-17 调研），
              原始快照存于 tmp/research/wiki2026/（已 gitignore）。
   【同人声明】名单仅作同人考据用途；人气值(pop)为游戏性设定（以 2025 年
              第十二届总决选名次为主基准：杨冰怡/宋昕冉/柏欣妤 前三），不代表
              真实人气。游戏剧情（王子杰离世时点、王婧/陶莺职务、CGT48 停摆等）
              为用户设定的同人虚构，与现实无关。
   ----------------------------------------------------------------------------
   结构约定（engine.buildRoster 按 era 消费）：
     DATA2026.teams    本部队伍（id 用于标签页筛选；id "PREP" = 预备生）
     DATA2026.branches 分团列表（id 即标签页筛选键）
     DATA2026.members  全部成员：
       本部成员  { id, name, team:"SII"..., gen, join, pop, captain? }
       分团成员  { id, name, team:"branch", branchTeam:"BEJ48"..., gen?,
                   branchLabel:"Team B" }        ← 简卡：仅姓名+队伍标注
   ========================================================================== */

"use strict";

const DATA2026 = {
  meta: {
    snapshotDate: "2026-01-01",
    source: "snh48wiki.top",
    fetchedDate: "2026-09-17",
    confidence: "checked",
    note: "本部 74 人（SII17/NII13/HII12/X15/预备生17）+ 影视部 2 人（HALL 分类）；四分团 159 人；SHY48 已于 2019 年解散；Team FT 2019 年取消",
  },

  /* ---------------- 本部队伍 ---------------- */
  teams: [
    { id: "SII",  name: "Team SII", short: "SII" },
    { id: "NII",  name: "Team NII", short: "NII" },
    { id: "HII",  name: "Team HII", short: "HII" },
    { id: "X",    name: "Team X",   short: "X" },
    { id: "PREP", name: "预备生",    short: "预备生" },
  ],

  /* ---------------- 分团列表 ---------------- */
  branches: [
    { id: "BEJ48", name: "BEJ48（北京）" },
    { id: "GNZ48", name: "GNZ48（广州）" },
    { id: "CKG48", name: "CKG48（重庆）" },
    { id: "CGT48", name: "CGT48（成都）" },
  ],

  /* ---------------- 本部在籍 74 人 ----------------
     pop 为游戏人气值（0-100，同人设定，基准=2025 第十二届总决选） */
  members: [
    // ======== Team SII（17人）队长：由淼 ========
    { id: "youmiao",     name: "由淼",   team: "SII", gen: "十三期生", join: "2019-11-29", pop: 70, captain: true },
    { id: "liuzengyan",  name: "刘增艳", team: "SII", gen: "五期生",   join: "2015-07-25", pop: 55 },
    { id: "tianshuli26", name: "田姝丽", team: "SII", gen: "五期生",   join: "2015-07-25", pop: 50 },
    { id: "yanmingjun26", name: "闫明筠", team: "SII", gen: "四期生", join: "2015-01-31", pop: 48 },
    { id: "chenyuzi",    name: "陈雨孜", team: "SII", gen: "十二期生", join: "2019-09-14", pop: 45 },
    { id: "zhaotianyang", name: "赵天杨", team: "SII", gen: "SHY48三期", join: "2017-10-14", pop: 35 },
    { id: "luxinyi",     name: "芦馨怡", team: "SII", gen: "十六期生", join: "2021-09-10", pop: 30 },
    { id: "yangxinyu",   name: "杨心渝", team: "SII", gen: "十八期生", join: "2023-05-02", pop: 24 },
    { id: "zhoutongyue", name: "周童玥", team: "SII", gen: "十八期生", join: "2023-05-02", pop: 24 },
    { id: "zhangqian",   name: "张倩",   team: "SII", gen: "十九期生", join: "2023-09-30", pop: 24 },
    { id: "zhangleilei", name: "张雷雷", team: "SII", gen: "二十一期生", join: "2024-08-29", pop: 22 },
    { id: "jiangxiayu",  name: "蒋夏羽", team: "SII", gen: "二十二期生", join: "2025-03-29", pop: 20 },
    { id: "shengle",     name: "盛乐",   team: "SII", gen: "二十二期生", join: "2025-03-29", pop: 20 },
    { id: "caoketian",   name: "曹可甜", team: "SII", gen: "二十三期生", join: "2025-08-16", pop: 18 },
    { id: "liushitong",  name: "刘诗彤", team: "SII", gen: "二十三期生", join: "2025-08-16", pop: 18 },
    { id: "liuyucheng",  name: "柳雨呈", team: "SII", gen: "二十三期生", join: "2025-08-16", pop: 18 },
    { id: "ningke",      name: "宁轲",   team: "SII", gen: "BEJ48七期", join: "2019-10-25", pop: 32 },

    // ======== Team NII（13人，队长未设） ========
    { id: "huxiaohui26", name: "胡晓慧", team: "NII", gen: "五期生",   join: "2015-07-25", pop: 58 },
    { id: "panyingqi26", name: "潘瑛琪", team: "NII", gen: "五期生",   join: "2015-07-25", pop: 50 },
    { id: "qingyuwen",   name: "青钰雯", team: "NII", gen: "六期生",   join: "2016-01-18", pop: 58 },
    { id: "jinyingyue",  name: "金莹玥", team: "NII", gen: "八期生",   join: "2017-05-28", pop: 42 },
    { id: "yangyuxin",   name: "杨宇馨", team: "NII", gen: "BEJ48四期", join: "2018-04-20", pop: 60 },
    { id: "huangziyi",   name: "黄紫怡", team: "NII", gen: "二十二期生", join: "2025-03-29", pop: 22 },
    { id: "tangchengcheng", name: "唐程成", team: "NII", gen: "十九期生", join: "2023-09-30", pop: 20 },
    { id: "yefan",       name: "叶凡",   team: "NII", gen: "十九期生", join: "2023-09-30", pop: 20 },
    { id: "zhongyanan",  name: "钟亚男", team: "NII", gen: "二十二期生", join: "2025-03-29", pop: 22 },
    { id: "baixinyu",    name: "柏欣妤", team: "NII", gen: "CKG48一期", join: "2017-10-27", pop: 92 },
    { id: "lutianhui",   name: "卢天惠", team: "NII", gen: "SHY48一期", join: "2016-10-29", pop: 35 },
    { id: "hanjiale",    name: "韩家乐", team: "NII", gen: "SHY48一期", join: "2016-10-29", pop: 38 },
    { id: "liujie",      name: "刘洁",   team: "NII", gen: "十期生",   join: "2018-09-09", pop: 40 },

    // ======== Team HII（12人，队长未设） ========
    { id: "jiangshuting26", name: "蒋舒婷", team: "HII", gen: "五期生", join: "2015-07-25", pop: 60 },
    { id: "lijiaen26",   name: "李佳恩", team: "HII", gen: "六期生",   join: "2016-03-26", pop: 52 },
    { id: "linshuqing",  name: "林舒晴", team: "HII", gen: "CKG48一期", join: "2017-10-27", pop: 45 },
    { id: "wenruoqi",    name: "温若其", team: "HII", gen: "十八期生", join: "2023-05-02", pop: 28 },
    { id: "youkeying",   name: "尤可莹", team: "HII", gen: "十八期生", join: "2023-05-02", pop: 26 },
    { id: "sunyushan",   name: "孙语姗", team: "HII", gen: "BEJ48一期", join: "2016-07-16", pop: 32 },
    { id: "lianghuaifang", name: "梁怀方", team: "HII", gen: "十九期生", join: "2023-09-30", pop: 25 },
    { id: "chenyuxi",    name: "陈俞希", team: "HII", gen: "二十一期生", join: "2024-08-29", pop: 26 },
    { id: "gongchenmei", name: "龚晨美", team: "HII", gen: "二十二期生", join: "2025-03-29", pop: 20 },
    { id: "kangchuyi",   name: "康楚翊", team: "HII", gen: "二十二期生", join: "2025-03-29", pop: 20 },
    { id: "quejiahui",   name: "阙佳慧", team: "HII", gen: "二十二期生", join: "2025-03-29", pop: 20 },
    { id: "qinkemeng",   name: "覃柯蒙", team: "HII", gen: "二十二期生", join: "2025-03-29", pop: 20 },

    // ======== Team X（15人）队长：杨冰怡（2025 总决选第一名） ========
    { id: "yangbingyi26", name: "杨冰怡", team: "X", gen: "四期生", join: "2015-01-31", pop: 97, captain: true, note: "2025 第十二届总决选第一名" },
    { id: "chenlin26",   name: "陈琳",   team: "X", gen: "四期生",   join: "2015-01-31", pop: 50 },
    { id: "songxinran26", name: "宋昕冉", team: "X", gen: "四期生", join: "2015-01-31", pop: 94, note: "2025 第十二届总决选第二名" },
    { id: "zuojingyuan", name: "左婧媛", team: "X", gen: "六期生",   join: "2016-01-18", pop: 58 },
    { id: "wangruiqi",   name: "王睿琦", team: "X", gen: "SHY48二期", join: "2017-04-29", pop: 58 },
    { id: "yangye",      name: "杨晔",   team: "X", gen: "BEJ48一期", join: "2016-07-16", pop: 45 },
    { id: "wubohan",     name: "武博涵", team: "X", gen: "十五期生", join: "2021-04-03", pop: 75, note: "2025-08 起兼任 Team SII" },
    { id: "linjiayi",    name: "林佳怡", team: "X", gen: "十五期生", join: "2021-04-03", pop: 36 },
    { id: "yujiawei",    name: "禹佳蔚", team: "X", gen: "十五期生", join: "2021-04-03", pop: 34 },
    { id: "xiongziyi",   name: "熊紫轶", team: "X", gen: "十六期生", join: "2021-09-09", pop: 38 },
    { id: "liuxiaohan",  name: "刘小涵", team: "X", gen: "十七期生", join: "2022-08-27", pop: 35 },
    { id: "yanna",       name: "闫娜",   team: "X", gen: "十四期生", join: "2020-10-02", pop: 62 },
    { id: "lizixin",     name: "李子忻", team: "X", gen: "二十一期生", join: "2024-08-29", pop: 30 },
    { id: "jinhongyan",  name: "金泓言", team: "X", gen: "二十一期生", join: "2024-08-29", pop: 30 },
    { id: "yangqiuye",   name: "杨秋野", team: "X", gen: "二十一期生", join: "2024-08-29", pop: 28 },

    // ======== 预备生（17人） ========
    { id: "huangzixin",  name: "黄子欣", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "zengxueting", name: "曾雪婷", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "kangshengjie", name: "康圣洁", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "liting26",    name: "李婷",   team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "liujingyang", name: "刘婧阳", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "shenxin",     name: "沈馨",   team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "lijichun",    name: "李继醇", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "xujialin",    name: "徐佳琳", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "liuruoxi",    name: "刘若熙", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "chenjiayi",   name: "陈嘉仪", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "liusiyu",     name: "刘思雨", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "zhongguofeiyang", name: "钟郭菲杨", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "jiangxinru",  name: "蒋欣洳", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "zengxinyan",  name: "曾昕妍", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "zhengkewei",  name: "郑柯炜", team: "PREP", gen: "二十三期预备生", join: "2025-09-23", pop: 14 },
    { id: "hanyunyi",    name: "韩云伊", team: "PREP", gen: "二十三期预备生", join: "2025-12-05", pop: 12 },
    { id: "yingziyan",   name: "应籽言", team: "PREP", gen: "二十二期预备生", join: "2025-03-29", pop: 16 },

    /* ---------------- 荣誉殿堂 · 影视部（HALL 分类，v0.10 新增） ----------------
       转入影视发展的公司体系艺人（不参加总选举，成员页「荣誉殿堂」标签页）：
       · 孙珍妮：snh48wiki 档案考据（tmp/research/careers3.json）——六期生，
         2016-03-26 入团（Team HII），「2023 年以后转影视部发展」；
       · 陆婷玉：丝芭影视签约演员（《隐形守护者》《花戎》等），非偶像体系出身，
         多次担任 SNH48 总决选/盛典特邀主持（网络公开报道，无 snh48wiki 档案页）。 */
    { id: "sunzhenni", name: "孙珍妮", team: "HALL", gen: "六期生 · 影视部", join: "2016-03-26", pop: 76, hall: true, note: "影视部（2023 年起转影视发展）" },
    { id: "lutingyu",  name: "陆婷玉", team: "HALL", gen: "影视部签约演员", pop: 72, hall: true, note: "丝芭影视签约演员（非偶像体系出身）" },

    /* ---------------- 分团成员（简卡：仅姓名 + 队伍标注，不参与本部玩法） ----------------
       注：游戏中 CGT48 已于 2025 年底停摆（同人设定），名单保留供剧情与重建线引用；
       标注「兼SNH48」的分团主力在各自分团建卡（兼任关系不作重复建卡）。 */

    // ======== BEJ48（北京）：Team B 15 + Team E 14 + 预备生 1 =========
    { id: "b_zhengzhaoxuan", name: "郑照暄", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B", gen: "B队队长" },
    { id: "b_wangjiaqi",  name: "王佳琪", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_baoying",    name: "包楹",   team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_jinwanying", name: "金宛莹", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_danzihan",   name: "单子涵", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_zhangmenghui", name: "张梦慧", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_huangxuanqi", name: "黄宣绮", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_nieyujing",  name: "聂渝景", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_zhuyuning",  name: "朱语凝", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_zhangyatong", name: "张雅童", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_zhuyining",  name: "朱一柠", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_wuruisha",   name: "吴睿莎", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_wangsiwen",  name: "王思文", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_wangzhiyi",  name: "王祉依", team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "b_chenyi",     name: "陈艺",   team: "branch", branchTeam: "BEJ48", branchLabel: "Team B" },
    { id: "e_zhuhongrong", name: "朱虹蓉", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E", gen: "E队队长" },
    { id: "e_zhouxiang",  name: "周湘",   team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_maxinyu",    name: "马欣宇", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_guoxiaoying", name: "郭晓盈", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_diaoxinyu",  name: "刁昕妤", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_sunjiafu",   name: "孙嘉馥", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_yuanhan",    name: "袁涵",   team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_dingziqin",  name: "丁子钦", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_zhuyuetong", name: "朱玥彤", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_guoyichen",  name: "郭依晨", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_qiaoshiran", name: "乔诗然", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_zhangtingting", name: "张婷婷", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_wangsiyi",   name: "王思奕", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "e_mamingxuan", name: "马明萱", team: "branch", branchTeam: "BEJ48", branchLabel: "Team E" },
    { id: "prep_alimire", name: "阿丽米热", team: "branch", branchTeam: "BEJ48", branchLabel: "预备生" },

    // ======== GNZ48（广州）：Team G 16 + Team NIII 11 + Team Z 14 + 预备生 12 =========
    { id: "g_zhangqiongyu", name: "张琼予", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G", gen: "G队队长" },
    { id: "g_wangzixin",  name: "王秭歆", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_yangkelu",   name: "杨可璐", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_huangchuyin", name: "黄楚茵", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_fangqi",     name: "方琪",   team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_chenshuyu",  name: "陈淑钰", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_liuxinyuan", name: "刘欣媛", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_linyixi",    name: "林奕希", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_linjiayi",   name: "林家谊", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_baoyuxin",   name: "鲍雨欣", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_leiruiyan",  name: "雷瑞妍", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_tangguo",    name: "唐果",   team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_zhulina",    name: "朱丽娜", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_linentong",  name: "林恩同", team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_kongyuan",   name: "孔渊",   team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "g_liangjiao",  name: "梁娇",   team: "branch", branchTeam: "GNZ48", branchLabel: "Team G" },
    { id: "n_xiangyujing", name: "项宇婧", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII", gen: "NIII队长" },
    { id: "n_xuzhengziying", name: "徐郑子滢", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "n_shizhujun",  name: "石竹君", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "n_lvsiqui",    name: "吕思琪", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "n_wangyuchen", name: "王语晨", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "n_wangjun",    name: "王珺",   team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "n_xiexiaoqian", name: "谢晓倩", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "n_liyongwei",  name: "李咏薇", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "n_xuhanjing",  name: "许涵婧", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "n_zhaowenfeng", name: "赵文凤", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "n_baijiayuan", name: "白佳媛", team: "branch", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { id: "z_longyirui",  name: "龙亦瑞", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z", gen: "Z队队长" },
    { id: "z_zhuyixin",   name: "朱怡欣", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_yangyuanyuan", name: "杨媛媛", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_yeshuqi",    name: "叶舒淇", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_xuchuwen",   name: "徐楚雯", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_maxinyue",   name: "马昕玥", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_chenshanling", name: "陈珊玲", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_dingjiaxin", name: "丁嘉欣", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_jiaoyue",    name: "焦玥",   team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_chengge",    name: "程戈",   team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_xuyongyi",   name: "许泳怡", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_luohanyue",  name: "罗寒月", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_liangqiao",  name: "梁乔",   team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "z_yeyingyu",   name: "叶溁语", team: "branch", branchTeam: "GNZ48", branchLabel: "Team Z" },
    { id: "gp_zhangjiayi", name: "张佳仪", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_wanfangyuan", name: "万芳源", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_xielinrong", name: "谢林容", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_chenshiying", name: "陈诗莹", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_dingzhen",  name: "丁甄奥果", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_hanzixuan", name: "韩梓轩", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_lijiamin",  name: "李家敏", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_liuliuqian", name: "刘柳茜", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_weishiqi",  name: "魏诗绮", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_wangzixuan", name: "王紫萱", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_zengyusi",  name: "曾雨思", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },
    { id: "gp_wangziyuan", name: "王紫媛", team: "branch", branchTeam: "GNZ48", branchLabel: "预备生" },

    // ======== CKG48（重庆）：Team C 14 + Team K 17 + 预备生 8 =========
    { id: "c_liangjingjin", name: "梁晶金", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_wangjiayu",  name: "王嘉瑜", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_leiyuxiao",  name: "雷宇霄", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_zhuruiyuan", name: "朱瑞缘", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_tanjingwen", name: "谭景文", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_chenxiaoyang", name: "陈萧扬", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_lindanlei",  name: "林丹蕾", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_yaojinjie",  name: "姚锦杰", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_zhuwenlu",   name: "朱文露", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_haoruxin",   name: "郝茹馨", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_wangsiyu",   name: "王思予", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_xuqinnan",   name: "徐沁楠", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_fumeishan",  name: "付美善", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "c_luojiezhen", name: "罗婕桢", team: "branch", branchTeam: "CKG48", branchLabel: "Team C" },
    { id: "k_wuzhiyue",   name: "吴志越", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_gejunyan",   name: "葛俊言", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_hexinman",   name: "何馨曼", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_zhangweiyi", name: "张伟依", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_zhangsiyan", name: "张思妍", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_hudan",      name: "胡丹",   team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_lumeiting",  name: "卢美廷", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_liuxingyu",  name: "刘星雨", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_maxingyue",  name: "马星月", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_zhanglili",  name: "张莉莉", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_zhangyongye", name: "张咏烨", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_husiying",   name: "胡思颖", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_yuanxican",  name: "袁希璨", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_chenziyue",  name: "陈子悦", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_yangtianling", name: "杨添淩", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_chenyunjia", name: "陈韵佳", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "k_zhuosijia",  name: "卓思佳", team: "branch", branchTeam: "CKG48", branchLabel: "Team K" },
    { id: "kp_huangmengxi", name: "黄孟浠", team: "branch", branchTeam: "CKG48", branchLabel: "预备生" },
    { id: "kp_heshiyu",   name: "何诗雨", team: "branch", branchTeam: "CKG48", branchLabel: "预备生" },
    { id: "kp_liaoyuhan", name: "廖雨涵", team: "branch", branchTeam: "CKG48", branchLabel: "预备生" },
    { id: "kp_wangzhennan", name: "王振楠", team: "branch", branchTeam: "CKG48", branchLabel: "预备生" },
    { id: "kp_yuqiguo",   name: "余茜果", team: "branch", branchTeam: "CKG48", branchLabel: "预备生" },
    { id: "kp_zhouyuhan", name: "周雨涵", team: "branch", branchTeam: "CKG48", branchLabel: "预备生" },
    { id: "kp_liuyingying", name: "刘莹莹", team: "branch", branchTeam: "CKG48", branchLabel: "预备生" },
    { id: "kp_haobingyuan", name: "郝冰圆", team: "branch", branchTeam: "CKG48", branchLabel: "预备生" },

    // ======== CGT48（成都）：游戏中 2025 年底停摆待重建（同人设定） ========
    // Team CII 15 + Team GII 11 + 预备生 11
    { id: "cii_guozhaoyuan", name: "郭兆媛", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_xiaying",  name: "夏莹",   team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_xuyalan",  name: "许雅兰", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_helinyan", name: "何林燕", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_meisihua", name: "梅思华", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_huangwei", name: "黄蔚",   team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_tansihui", name: "谭思慧", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_songxiaolu", name: "宋筱璐", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_zhoushiru", name: "周是汝", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_qinludan", name: "秦露丹", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_shenyuxin", name: "申雨鑫", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_huangyi",  name: "黄逸",   team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_qiulijia", name: "邱刘佳", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_xuyuqing", name: "徐钰清", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "cii_zhangyuduo", name: "张羽多", team: "branch", branchTeam: "CGT48", branchLabel: "Team CII" },
    { id: "gii_hecaixian", name: "何蔡娴", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII", gen: "GII队长" },
    { id: "gii_xuyuhan",  name: "徐钰涵", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "gii_liqiuyue", name: "李秋月", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "gii_linhaiying", name: "林海盈", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "gii_wangyi",   name: "王依",   team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "gii_chengbaoyu", name: "程宝玉", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "gii_qilingquan", name: "齐灵泉", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "gii_wangyilin", name: "王艺霖", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "gii_yuanzijie", name: "袁艺洁", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "gii_tanyonghang", name: "谭勇航", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "gii_leixiangju", name: "雷相菊", team: "branch", branchTeam: "CGT48", branchLabel: "Team GII" },
    { id: "cgp_gengyujia", name: "耿钰嘉", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_zhangling", name: "张伶",  team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_lijiaqi",  name: "李嘉琪", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_wangjingyu", name: "王靖雨", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_wangyiQi", name: "王艺淇", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_xiongsiuqing", name: "熊玊清", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_zhengjianan", name: "郑佳男", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_zhangyuxin", name: "张于馨", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_wangxiangyi", name: "王相懿", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_wangxiaomeng", name: "王小萌", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
    { id: "cgp_wuhuayi",  name: "吴婳祎", team: "branch", branchTeam: "CGT48", branchLabel: "预备生" },
  ],

  /* ---------------- 2026 年内新入团（引擎按月加入名单） ----------------
     史实：二十四期生 9 人于 2026-05-01 公布（snh48wiki.top 期生时间线），
     游戏内压缩为 5 月「春季招新」事件，全部以预备生身份加入本部。 */
  joining2026: [
    { month: 5, name: "秦箐忆", team: "PREP", gen: "二十四期生", join: "2026-05-01" },
    { month: 5, name: "臧文萱", team: "PREP", gen: "二十四期生", join: "2026-05-01" },
    { month: 5, name: "刘钇霏", team: "PREP", gen: "二十四期生", join: "2026-05-01" },
    { month: 5, name: "黄子珊", team: "PREP", gen: "二十四期生", join: "2026-05-01" },
    { month: 5, name: "丁小凡", team: "PREP", gen: "二十四期生", join: "2026-05-01" },
    { month: 5, name: "杨宝君", team: "PREP", gen: "二十四期生", join: "2026-05-01" },
    { month: 5, name: "李沁洁", team: "PREP", gen: "二十四期生", join: "2026-05-01", note: "与GNZ48李沁洁同名的另一人" },
    { month: 5, name: "吉雅楠", team: "PREP", gen: "二十四期生", join: "2026-05-01" },
    { month: 5, name: "何绮多", team: "PREP", gen: "二十四期生", join: "2026-05-01" },
  ],

  /* ---------------- 2027 年人员变动（2027「大河新篇」线） ----------------
     【同人虚构说明】2027 年为未来年份，官方名单尚未公布——二十五期生 6 人为
     【同人虚构人物】（成员卡备注已标注，现实无对应）；
     官方名单公布后可整表替换为史实数据（joining2026 同款格式 month/name/team/gen/join）。
     引擎装载：engine.monthStart 按 DATA2026.joining2027 / leaving2027 逐月生效（era==="2027"）。
     参考口径：二十五期生按惯例约 2027 年 5 月前后公布（加入本部预备生）。 */
  joining2027: [
    { month: 5, name: "苏念安", team: "PREP", gen: "二十五期生", join: "2027-05-01", note: "同人虚构角色（二十五期生）" },
    { month: 5, name: "顾星晚", team: "PREP", gen: "二十五期生", join: "2027-05-01", note: "同人虚构角色（二十五期生）" },
    { month: 5, name: "温书宁", team: "PREP", gen: "二十五期生", join: "2027-05-01", note: "同人虚构角色（二十五期生）" },
    { month: 5, name: "程夏至", team: "PREP", gen: "二十五期生", join: "2027-05-01", note: "同人虚构角色（二十五期生）" },
    { month: 5, name: "白诗晗", team: "PREP", gen: "二十五期生", join: "2027-05-01", note: "同人虚构角色（二十五期生）" },
    { month: 5, name: "贺清圆", team: "PREP", gen: "二十五期生", join: "2027-05-01", note: "同人虚构角色（二十五期生）" },
  ],
  leaving2027: [
    // { month: 7, name: "——", team: "X", type: "毕业", note: "——" },   ← 预挂载：官方名单公布后按格式填入
  ],

  /* ---------------- WHN48（武汉）成立名单（2027「大河新篇」线·同人虚构） ----------------
     【重要】WHN48 本身为架空设定（王子杰地图伏笔的同人回收），现实中不存在该团体，
     以下一期生为【同人虚构人物】，非真实成员——若官方日后公布真实名单可整表替换。
     Team W 8 人 + Team H 8 人；deployWH 在 WHN48 首演亮灯时建卡（预备生起步），
     并将 2026 线末位淘汰「调往 CGT48 委培」时约定移籍的成员（whAgreed26）一并转入。 */
  whFoundingRoster: [
    { name: "江雨眠", branchLabel: "Team W" },
    { name: "夏晚晴", branchLabel: "Team W" },
    { name: "林知夏", branchLabel: "Team W" },
    { name: "周芷宁", branchLabel: "Team W" },
    { name: "许清晏", branchLabel: "Team W" },
    { name: "唐诗遥", branchLabel: "Team W" },
    { name: "罗小满", branchLabel: "Team W" },
    { name: "韩霁月", branchLabel: "Team W" },
    { name: "方念楚", branchLabel: "Team H" },
    { name: "阮青禾", branchLabel: "Team H" },
    { name: "闻人镜", branchLabel: "Team H" },
    { name: "池鹿鸣", branchLabel: "Team H" },
    { name: "岑今是", branchLabel: "Team H" },
    { name: "易绾云", branchLabel: "Team H" },
    { name: "任平生", branchLabel: "Team H" },
    { name: "纪云裳", branchLabel: "Team H" },
  ],
};

/* ---------------- 工具 ---------------- */
/* 2026 线活跃成员（= 本部在籍，分团简卡与已离团者除外） */
DATA2026.activeMembers = function () {
  return this.members.filter(m => m.team !== "branch");
};
