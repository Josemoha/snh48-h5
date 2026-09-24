/* ============================================================================
   data_members.js — 成员名单数据（2016 年 1 月在籍快照 + 全年变动）
   ----------------------------------------------------------------------------
   【数据来源】snh48wiki.top（SNH48中文维基）成员档案页 / 期生时间线 / 离团时间线 /
              历届总决选页，关键日期经两处以上交叉验证（调研于 2026-09-17）。
              另参考：百度百科（总决选条目）、SNH48 官网活动页、中国日报/凤凰网
              （BEJ48/GNZ48 成立报道）。
   【同人声明】名单与日期仅作同人游戏考据用途；人气值(pop)是游戏性设定（以
              2015 年第二届总决选名次为主基准加工而成），不代表真实人气，
              亦不代表对任何成员的评价。如与史实有出入，以维基为准。
   ----------------------------------------------------------------------------
   数据结构：
     DATA.teams        各队元信息（成立日期、队徽色）
     DATA.members      2016-01-01 在籍 116 人（id/name/team/gen/join/pop/captain/note）
     DATA.joining2016  2016 年内新入团成员（按月加入：六期生 3 月、七期生 9/10 月）
     DATA.leaving2016  2016 年内离团/暂休/移籍事件（引擎按月触发剧情）
     DATA.branchMovers 2016-04-20 移籍 BEJ48 / GNZ48 的 21 人（分团剧情核心素材）
     DATA.election2015Top / DATA.election2016  两届总决选考据数据（剧情用）
   ========================================================================== */

"use strict";

const DATA = {
  meta: {
    snapshotDate: "2016-01-01",          // 名单快照时点
    source: "snh48wiki.top",
    fetchedDate: "2026-09-17",
    confidence: "checked",               // 名单已按维基多页交叉校对
    note: "2016-01-01 当日本团无研究生（五期生已于 2015-12-04 全部升格入 Team XII）",
  },

  /* ---------------- 队伍元信息 ---------------- */
  teams: {
    SII: { name: "Team SII",  formed: "2013-11-11" },
    NII: { name: "Team NII",  formed: "2013-11-11" },
    HII: { name: "Team HII",  formed: "2014-09-05" },
    X:   { name: "Team X",    formed: "2015-04-17" },
    XII: { name: "Team XII",  formed: "2015-12-04" },
  },

  /* ---------------- 2016-01-01 在籍名单（116 人） ----------------
     gen  : 期数（"一期生"…"五期生"，留学生单独标注）
     join : 入团日期（入队日不同时在 note 说明）
     pop  : 游戏人气值 0-100（同人设定，基准=2015 二届总选名次）
     captain / vice : 2015-09-13 / 2015-02-13 任命的队长副队长
  ------------------------------------------------------------------ */
  members: [
    // ======== Team SII（25人）队长：戴萌 / 副队长：莫寒 ========
    { id: "chenguanhui", name: "陈观慧", team: "SII", gen: "一期生", join: "2012-10-14", pop: 58 },
    { id: "chensi",      name: "陈思",   team: "SII", gen: "一期生", join: "2012-10-14", pop: 46 },
    { id: "daimeng",     name: "戴萌",   team: "SII", gen: "一期生", join: "2012-10-14", pop: 70, captain: true },
    { id: "kongxiaoyin", name: "孔肖吟", team: "SII", gen: "一期生", join: "2012-10-14", pop: 55 },
    { id: "liyuqi",      name: "李宇琪", team: "SII", gen: "一期生", join: "2012-10-14", pop: 68 },
    { id: "mohan",       name: "莫寒",   team: "SII", gen: "一期生", join: "2012-10-14", pop: 76, vice: true },
    { id: "qianbeiting", name: "钱蓓婷", team: "SII", gen: "一期生", join: "2012-10-14", pop: 62 },
    { id: "qiuxinyi",    name: "邱欣怡", team: "SII", gen: "一期生", join: "2012-10-14", pop: 57 },
    { id: "xunchenchen", name: "徐晨辰", team: "SII", gen: "一期生", join: "2012-10-14", pop: 50 },
    { id: "xujiaqi",     name: "许佳琪", team: "SII", gen: "一期生", join: "2012-10-14", pop: 64 },
    { id: "zhangyuge",   name: "张语格", team: "SII", gen: "一期生", join: "2012-10-14", pop: 80 },
    { id: "zhaojiamin",  name: "赵嘉敏", team: "SII", gen: "一期生", join: "2012-10-14", pop: 92, note: "第二届总决选冠军" },
    { id: "miyazawasae", name: "宫泽佐江", team: "SII", gen: "留学生", join: "2012-11-01", pop: 58, note: "兼任 SKE48 Team S 队长" },
    { id: "suzukimaria", name: "铃木玛莉亚", team: "SII", gen: "留学生", join: "2012-11-01", pop: 45, note: "兼任 AKB48 Team K" },
    { id: "jiangyun",    name: "蒋芸",   team: "SII", gen: "二期生", join: "2013-08-18", pop: 50 },
    { id: "shenzhilin",  name: "沈之琳", team: "SII", gen: "二期生", join: "2013-08-18", pop: 40 },
    { id: "sunrui",      name: "孙芮",   team: "SII", gen: "二期生", join: "2013-08-18", pop: 62 },
    { id: "wenjingjie",  name: "温晶婕", team: "SII", gen: "二期生", join: "2013-08-18", pop: 42 },
    { id: "xuzixuan",    name: "徐子轩", team: "SII", gen: "二期生", join: "2013-08-18", pop: 38 },
    { id: "yuanyuzhen",  name: "袁雨桢", team: "SII", gen: "二期生", join: "2013-08-18", pop: 36 },
    { id: "yuandanni",   name: "袁丹妮", team: "SII", gen: "三期生", join: "2014-07-26", pop: 44, note: "2015-09 起兼任 Team HII" },
    { id: "zhaoye",      name: "赵晔",   team: "SII", gen: "三期生", join: "2014-07-26", pop: 34 },
    { id: "liuliwei",    name: "刘力玮", team: "SII", gen: "五期生", join: "2015-07-25", pop: 30 },
    { id: "shenyuejiao", name: "申月姣", team: "SII", gen: "五期生", join: "2015-07-25", pop: 28 },
    { id: "xujiali",     name: "徐佳丽", team: "SII", gen: "五期生", join: "2015-07-25", pop: 26 },

    // ======== Team NII（21人）队长：冯薪朵 / 副队长：黄婷婷 ========
    { id: "chenjiaying", name: "陈佳莹", team: "NII", gen: "二期生", join: "2013-08-18", pop: 36 },
    { id: "dongyanyun",  name: "董艳芸", team: "NII", gen: "二期生", join: "2013-08-18", pop: 34 },
    { id: "fengxinduo",  name: "冯薪朵", team: "NII", gen: "二期生", join: "2013-08-18", pop: 78, captain: true },
    { id: "gongshiqi",   name: "龚诗淇", team: "NII", gen: "二期生", join: "2013-08-18", pop: 48 },
    { id: "hexiaoyu",    name: "何晓玉", team: "NII", gen: "二期生", join: "2013-08-18", pop: 40 },
    { id: "huangtingting", name: "黄婷婷", team: "NII", gen: "二期生", join: "2013-08-18", pop: 85, vice: true },
    { id: "jujingyi",    name: "鞠婧祎", team: "NII", gen: "二期生", join: "2013-08-18", pop: 94 },
    { id: "liyitong",    name: "李艺彤", team: "NII", gen: "二期生", join: "2013-08-18", pop: 88 },
    { id: "linsiyi",     name: "林思意", team: "NII", gen: "二期生", join: "2013-08-18", pop: 60 },
    { id: "luting",      name: "陆婷",   team: "NII", gen: "二期生", join: "2013-08-18", pop: 74 },
    { id: "luolan",      name: "罗兰",   team: "NII", gen: "二期生", join: "2013-08-18", pop: 32 },
    { id: "mengyue",     name: "孟玥",   team: "NII", gen: "二期生", join: "2013-08-18", pop: 30 },
    { id: "tanganqi",    name: "唐安琪", team: "NII", gen: "二期生", join: "2013-08-18", pop: 62 },
    { id: "wanlina",     name: "万丽娜", team: "NII", gen: "二期生", join: "2013-08-18", pop: 68 },
    { id: "yijiaai",     name: "易嘉爱", team: "NII", gen: "二期生", join: "2013-08-18", pop: 44 },
    { id: "zengyanfen",  name: "曾艳芬", team: "NII", gen: "二期生", join: "2013-08-18", pop: 78 },
    { id: "zhaoyue",     name: "赵粤",   team: "NII", gen: "二期生", join: "2013-08-18", pop: 72 },
    { id: "chenwenyan",  name: "陈问言", team: "NII", gen: "二期生", join: "2014-04-17", pop: 34 },
    { id: "zhangyuxin",  name: "张雨鑫", team: "NII", gen: "三期生", join: "2014-07-26", pop: 42 },
    { id: "liushilei",   name: "刘诗蕾", team: "NII", gen: "五期生", join: "2015-07-25", pop: 26 },
    { id: "zhouyi",      name: "周怡",   team: "NII", gen: "五期生", join: "2015-07-25", pop: 24 },

    // ======== Team HII（18人）队长：王璐 / 副队长：吴燕文 ========
    { id: "chenyixin",   name: "陈怡馨", team: "HII", gen: "三期生", join: "2014-07-26", pop: 48 },
    { id: "haowanqing",  name: "郝婉晴", team: "HII", gen: "三期生", join: "2014-07-26", pop: 40 },
    { id: "liqingyang",  name: "李清扬", team: "HII", gen: "三期生", join: "2014-07-26", pop: 38 },
    { id: "linnan",      name: "林楠",   team: "HII", gen: "三期生", join: "2014-07-26", pop: 44 },
    { id: "liujiongran", name: "刘炅然", team: "HII", gen: "三期生", join: "2014-07-26", pop: 30 },
    { id: "liupeixin",   name: "刘佩鑫", team: "HII", gen: "三期生", join: "2014-07-26", pop: 46 },
    { id: "wangbaishuo", name: "王柏硕", team: "HII", gen: "三期生", join: "2014-07-26", pop: 28 },
    { id: "wanglu",      name: "王璐",   team: "HII", gen: "三期生", join: "2014-07-26", pop: 38, captain: true },
    { id: "wuyanwen",    name: "吴燕文", team: "HII", gen: "三期生", join: "2014-07-26", pop: 36, vice: true },
    { id: "xieni",       name: "谢妮",   team: "HII", gen: "三期生", join: "2014-07-26", pop: 46 },
    { id: "xuhan",       name: "徐晗",   team: "HII", gen: "三期生", join: "2014-07-26", pop: 32 },
    { id: "xuyiren",     name: "徐伊人", team: "HII", gen: "三期生", join: "2014-07-26", pop: 50 },
    { id: "xuyangyuzhuo", name: "许杨玉琢", team: "HII", gen: "三期生", join: "2014-07-26", pop: 48 },
    { id: "yanghuiting", name: "杨惠婷", team: "HII", gen: "三期生", join: "2014-07-26", pop: 34 },
    { id: "zhangxin",    name: "张昕",   team: "HII", gen: "三期生", join: "2014-07-26", pop: 32 },
    { id: "shenmengyao", name: "沈梦瑶", team: "HII", gen: "五期生", join: "2015-07-25", pop: 28 },
    { id: "wanglujiao",  name: "王露皎", team: "HII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "yuanhang",    name: "袁航",   team: "HII", gen: "五期生", join: "2015-07-25", pop: 24 },

    // ======== Team X（17人）队长：李晶 / 副队长：邵雪聪 ========
    { id: "wuzhehan",    name: "吴哲晗", team: "X", gen: "一期生", join: "2012-10-14", pop: 52, note: "第一届总决选冠军，2015-04 加入 Team X" },
    { id: "chenlin",     name: "陈琳",   team: "X", gen: "四期生", join: "2015-01-31", pop: 36 },
    { id: "fengxiaofei", name: "冯晓菲", team: "X", gen: "四期生", join: "2015-01-31", pop: 42 },
    { id: "lijing",      name: "李晶",   team: "X", gen: "四期生", join: "2015-01-31", pop: 34, captain: true },
    { id: "lizhao",      name: "李钊",   team: "X", gen: "四期生", join: "2015-01-31", pop: 26 },
    { id: "shaoxuecong", name: "邵雪聪", team: "X", gen: "四期生", join: "2015-01-31", pop: 46, vice: true },
    { id: "songxinran",  name: "宋昕冉", team: "X", gen: "四期生", join: "2015-01-31", pop: 40 },
    { id: "sunxinwen",   name: "孙歆文", team: "X", gen: "四期生", join: "2015-01-31", pop: 24 },
    { id: "wangjialing", name: "汪佳翎", team: "X", gen: "四期生", join: "2015-01-31", pop: 28 },
    { id: "wangshu",     name: "汪束",   team: "X", gen: "四期生", join: "2015-01-31", pop: 26 },
    { id: "wangxiaojia", name: "王晓佳", team: "X", gen: "四期生", join: "2015-01-31", pop: 30 },
    { id: "xietianyi",   name: "谢天依", team: "X", gen: "四期生", join: "2015-01-31", pop: 40 },
    { id: "yanmingjun",  name: "闫明筠", team: "X", gen: "四期生", join: "2015-01-31", pop: 28 },
    { id: "yangbingyi",  name: "杨冰怡", team: "X", gen: "四期生", join: "2015-01-31", pop: 34 },
    { id: "yangyunyu",   name: "杨韫玉", team: "X", gen: "四期生", join: "2015-01-31", pop: 24 },
    { id: "zhangdansan", name: "张丹三", team: "X", gen: "四期生", join: "2015-01-31", pop: 30 },
    { id: "zhangyunwen", name: "张韵雯", team: "X", gen: "四期生", join: "2015-01-31", pop: 26 },

    // ======== Team XII（35人，全部五期生，2015-12-04 入队，首任队长 9 月才任命） ========
    { id: "zengaijia",   name: "曾艾佳", team: "XII", gen: "五期生", join: "2015-07-25", pop: 36 },
    { id: "chenke",      name: "陈珂",   team: "XII", gen: "五期生", join: "2015-07-25", pop: 38 },
    { id: "chenmeijun",  name: "陈美君", team: "XII", gen: "五期生", join: "2015-07-25", pop: 30 },
    { id: "chenyin",     name: "陈音",   team: "XII", gen: "五期生", join: "2015-07-25", pop: 22 },
    { id: "chenyuqi",    name: "陈雨琪", team: "XII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "chenyunling", name: "陈韫凌", team: "XII", gen: "五期生", join: "2015-07-25", pop: 26 },
    { id: "duyuwei",     name: "杜雨微", team: "XII", gen: "五期生", join: "2015-07-25", pop: 22 },
    { id: "duanyixuan",  name: "段艺璇", team: "XII", gen: "五期生", join: "2015-07-25", pop: 46 },
    { id: "feiqinyuan",  name: "费沁源", team: "XII", gen: "五期生", join: "2015-07-25", pop: 40 },
    { id: "fengxueying", name: "冯雪莹", team: "XII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "gaoyuanjing", name: "高源婧", team: "XII", gen: "五期生", join: "2015-07-25", pop: 26 },
    { id: "hongpeiyun",  name: "洪珮雲", team: "XII", gen: "五期生", join: "2015-07-25", pop: 38 },
    { id: "huxiaohui",   name: "胡晓慧", team: "XII", gen: "五期生", join: "2015-07-25", pop: 28 },
    { id: "jiangshan",   name: "姜杉",   team: "XII", gen: "五期生", join: "2015-07-25", pop: 32 },
    { id: "jiangshuting", name: "蒋舒婷", team: "XII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "liqinjie",    name: "李沁洁", team: "XII", gen: "五期生", join: "2015-07-25", pop: 26 },
    { id: "linjiapei",   name: "林嘉佩", team: "XII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "liumengya",   name: "刘梦雅", team: "XII", gen: "五期生", join: "2015-07-25", pop: 22 },
    { id: "liuxiaoxiao", name: "刘筱筱", team: "XII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "liuzengyan",  name: "刘增艳", team: "XII", gen: "五期生", join: "2015-07-25", pop: 34 },
    { id: "panyingqi",   name: "潘瑛琪", team: "XII", gen: "五期生", join: "2015-07-25", pop: 22 },
    { id: "shiyujie",    name: "时语婕", team: "XII", gen: "五期生", join: "2015-07-25", pop: 20 },
    { id: "songsixian",  name: "宋思娴", team: "XII", gen: "五期生", join: "2015-07-25", pop: 26 },
    { id: "songyushan",  name: "宋雨珊", team: "XII", gen: "五期生", join: "2015-07-25", pop: 22 },
    { id: "tianshuli",   name: "田姝丽", team: "XII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "xieleilei",   name: "谢蕾蕾", team: "XII", gen: "五期生", join: "2015-07-25", pop: 42 },
    { id: "xiongsujun",  name: "熊素君", team: "XII", gen: "五期生", join: "2015-07-25", pop: 22 },
    { id: "yanjiaojun",  name: "严佼君", team: "XII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "yangqingying", name: "阳青颖", team: "XII", gen: "五期生", join: "2015-07-25", pop: 22 },
    { id: "yujiayi",     name: "於佳怡", team: "XII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "zhanghanxiao", name: "张菡筱", team: "XII", gen: "五期生", join: "2015-07-25", pop: 28 },
    { id: "zhangkaiqi",  name: "张凯祺", team: "XII", gen: "五期生", join: "2015-07-25", pop: 30 },
    { id: "zhangwenjing", name: "张文静", team: "XII", gen: "五期生", join: "2015-07-25", pop: 22 },
    { id: "zhangyi",     name: "张怡",   team: "XII", gen: "五期生", join: "2015-07-25", pop: 32 },
    { id: "zoujiajia",   name: "邹佳佳", team: "XII", gen: "五期生", join: "2015-07-25", pop: 26 },
  ],

  /* ---------------- 2016 年内新加入（引擎按月加入名单） ----------------
     六期生 2016-03-26 直接入队；七期生 2016-09-15 入队；10-28 七期补充 1 人。
     另有「六期生·分团方向 47 人」2016-01-18 以培训生身份入团，
     属分团剧情素材（用 DATA.branchTrainees 概括，不逐人建卡）。 */
  joining2016: [
    { month: 3, name: "成珏",     team: "SII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "邓艳秋菲", team: "NII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "黄彤扬",   team: "NII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "钱艺",     team: "NII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "孙珍妮",   team: "HII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "王金铭",   team: "HII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "林忆宁",   team: "X",   gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "张嘉予",   team: "X",   gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "程文路",   team: "XII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "李佳恩",   team: "XII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "吕梦莹",   team: "XII", gen: "六期生", join: "2016-03-26" },
    { month: 9, name: "吕一",     team: "SII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "潘燕琦",   team: "SII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "赵韩倩",   team: "SII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "江真仪",   team: "NII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "刘菊子",   team: "NII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "刘瀛",     team: "NII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "许逸",     team: "NII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "徐真",     team: "NII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "张雅梦",   team: "NII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "袁一琦",   team: "HII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "祁静",     team: "X",   gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "徐诗琪",   team: "XII", gen: "七期生", join: "2016-09-15" },
    { month: 9, name: "曾晓雯",   team: "XII", gen: "七期生", join: "2016-09-15" },
    { month: 10, name: "姚祎纯",  team: "X",   gen: "七期生", join: "2016-10-28" },
  ],

  /* ---------------- 2016 年内离团 / 暂休 / 兼任变动 ----------------
     month: 游戏内触发月份（按史实日期归月）
     type : 毕业 / 退团 / 离团 / 活动结束 / 撤销兼任 / 暂休
     story: true 的会触发月度告别剧情，false 仅记入日志
     注意：按同人创作惯例，剧情一律作正面、体面的告别处理。 */
  leaving2016: [
    { month: 2, name: "时语婕",   team: "XII", date: "2016-02-02", type: "退团",     story: false },
    { month: 3, name: "孟玥",     team: "NII", date: "2016-03-02", type: "毕业",     story: true },
    { month: 3, name: "刘诗蕾",   team: "NII", date: "2016-03",    type: "离团",     story: false },
    { month: 3, name: "宫泽佐江", team: "SII", date: "2016-03-16", type: "活动结束", story: true, note: "返回日本专注于 SKE48 的工作" },
    { month: 5, name: "程文路",   team: "XII", date: "2016-05",    type: "离团",     story: false },
    { month: 6, name: "铃木玛莉亚", team: "SII", date: "2016-06-10", type: "撤销兼任", story: true, note: "AKB48 方面结束兼任，回归 AKB48" },
    { month: 7, name: "申月姣",   team: "SII", date: "2016-07-01", type: "退团",     story: false },
    { month: 7, name: "赵嘉敏",   team: "SII", date: "2016-07-30", type: "暂休",     story: true, note: "第二届总决选冠军，本年未参加第三届总决选" },
    { month: 8, name: "刘力玮",   team: "SII", date: "2016-08-14", type: "退团",     story: false },
    { month: 8, name: "钱艺",     team: "NII", date: "2016-08",    type: "离团",     story: false },
    { month: 8, name: "邓艳秋菲", team: "NII", date: "2016-08",    type: "离团",     story: false },
    { month: 9, name: "闫明筠",   team: "X",   date: "2016-09-15", type: "移籍BEJ48", branchTeam: "BEJ48", story: false, note: "移籍 BEJ48 Team B" },
    { month: 10, name: "张韵雯",  team: "X",   date: "2016-10",    type: "离团",     story: false },
    { month: 11, name: "陈怡馨",  team: "HII", date: "2016-11",    type: "离团",     story: true },
    { month: 11, name: "王璐",    team: "HII", date: "2016-11",    type: "离团",     story: true, note: "Team HII 队长" },
  ],

  /* ---------------- 2016-04-20 分团移籍名单（分团剧情核心素材） ----------------
     史实：BEJ48/GNZ48 于 2016-04-20 宣布成立，68 人组成四队。
     游戏中：若分团主线成功，这 21 名五期生从 SNH48 名单移入分团名单；
            另有六期生·分团方向培训生 47 人同日入队（作人数处理）。 */
  branchMovers: {
    BEJ: ["陈美君", "段艺璇", "冯雪莹", "胡晓慧", "宋思娴", "田姝丽", "熊素君", "徐佳丽", "张菡筱"],
    GNZ: ["陈珂", "陈雨琪", "杜雨微", "高源婧", "李沁洁", "林嘉佩", "刘梦雅", "刘筱筱", "阳青颖", "曾艾佳", "张凯祺", "谢蕾蕾"],
  },

  /* ---------------- 总决选考据数据（剧情对照用） ---------------- */
  election2015Top: [
    { rank: 1, name: "赵嘉敏", team: "SII", votes: 74393.0 },
    { rank: 2, name: "鞠婧祎", team: "NII", votes: 64785.5 },
    { rank: 3, name: "李艺彤", team: "NII", votes: 47134.5 },
    { rank: 4, name: "黄婷婷", team: "NII", votes: 35189.0 },
    { rank: 5, name: "张语格", team: "SII", votes: 32306.0 },
  ],

  election2016: {
    name: "「比翼齐飞」第三届偶像年度人气总决选",
    theme: "比翼齐飞",
    date: "2016-07-30",
    venue: "上海梅赛德斯-奔驰文化中心",
    // 史实前五（游戏内会因玩家经营产生变化，此为剧情对照）
    top5: [
      { rank: 1, name: "鞠婧祎", team: "NII", votes: 230752.7 },
      { rank: 2, name: "李艺彤", team: "NII", votes: 169971.4 },
      { rank: 3, name: "黄婷婷", team: "NII", votes: 130258.3 },
      { rank: 4, name: "曾艳芬", team: "NII", votes: 88656.8 },
      { rank: 5, name: "冯薪朵", team: "NII", votes: 88598.8 },
    ],
  },

  /* 金曲大赏考据：覆盖 2016 年度的是第三届 REQUEST TIME BEST 50，
     史实举办日为 2017-01-07；游戏内压缩到 12 月末作为年度收官事件。 */
  requestTime: {
    name: "第三届年度金曲大赏 REQUEST TIME BEST 50",
    gameDate: "2016-12-30",
    historyDate: "2017-01-07",
    prevChampion: "《夜蝶》李艺彤 & 黄婷婷（第二届 BEST 30，2015-12-26）",
  },

  /* 分团历史节点（主线任务节奏的史实锚点） */
  branchHistory: {
    traineeDate: "2016-01-18",   // 六期生·分团方向 47 人以培训生身份入团
    announceDate: "2016-04-20",  // BEJ48 / GNZ48 宣布成立
    theaterOpenDate: "2016-04-29", // 两地星梦剧院首演《剧场女神》
  },
};

/* ---------------- 工具函数 ---------------- */

/* 按 id 查找成员 */
DATA.findById = function (id) {
  return this.members.find(m => m.id === id) || null;
};

/* 当前活跃（未离团）成员列表 */
DATA.activeMembers = function () {
  return this.members.filter(m => m.status !== "left");
};

/* 生成年份显示用中文月份 */
DATA.monthCN = function (m) {
  return m + "月";
};
