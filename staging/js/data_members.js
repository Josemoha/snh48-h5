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
    /* 唐安琪 note 为玩家向文案（会显示在成员卡上）；事件 ID 信息仅留注释 */
    { month: 3, name: "唐安琪",   team: "NII", date: "2016-03",    type: "暂休",     story: false, note: "3月末意外烧伤，专心治疗休养（2017 线康复后解约）" },
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

  /* ---------------- 2017年1月分团在册名册（2017「本部新章」线考据补充） ----------------
     考据来源：tmp/research/careers3.json（snh48wiki 成员生涯快照），逐人核对其
     2017-01-01 时点所属队伍；其中六期生 9+17+5+16=47 人，恰与「2016年4·20 划入
     分团的六期生·分团方向 47 人」完全对应（交叉验证通过）。
     · BEJ48：Team B（队长 段艺璇 / 副队长 刘姝贤，2016-09-15 任命）+
              Team E（队长 李想 / 副队长 刘胜男，2016-09-15 任命）；
              五期生宋思娴/徐佳丽为 2016 官宣移籍成员（生涯快照缺考据，按移籍事实补录）。
     · GNZ48：Team G（队长 曾艾佳 / 副队长 高源婧，2016-10-01 任命）+
              Team NIII（队长 刘力菲 / 副队长 刘倩倩，2016-10-02 任命）。
     · GNZ48 Team Z（2016年10月结成·广州本地招募）生涯快照缺失，不逐人建卡。
     carryTo2017 按本表补建缺失的分团成员卡；已在籍的移籍成员卡（含人气/羁绊）保留不动。 */
   branchRoster2017: {
     BEJ48: [
       { name: "陈美君", branchLabel: "Team B", gen: "五期生" },
       { name: "段艺璇", branchLabel: "Team B", gen: "五期生", captain: true },
       { name: "冯雪莹", branchLabel: "Team B", gen: "五期生" },
       { name: "胡晓慧", branchLabel: "Team B", gen: "五期生" },
       { name: "宋思娴", branchLabel: "Team B", gen: "五期生" },
       { name: "田姝丽", branchLabel: "Team B", gen: "五期生" },
       { name: "熊素君", branchLabel: "Team B", gen: "五期生" },
       { name: "徐佳丽", branchLabel: "Team B", gen: "五期生" },
       { name: "张菡筱", branchLabel: "Team B", gen: "五期生" },
       { name: "闫明筠", branchLabel: "Team B", gen: "四期生" },
       { name: "胡博文", branchLabel: "Team B", gen: "六期生" },
       { name: "林溪荷", branchLabel: "Team B", gen: "六期生" },
       { name: "刘姝贤", branchLabel: "Team B", gen: "六期生", vice: true },
       { name: "牛聪聪", branchLabel: "Team B", gen: "六期生" },
       { name: "青钰雯", branchLabel: "Team B", gen: "六期生" },
       { name: "孙姗",   branchLabel: "Team B", gen: "六期生" },
       { name: "文妍",   branchLabel: "Team B", gen: "六期生" },
       { name: "夏越",   branchLabel: "Team B", gen: "六期生" },
       { name: "张梦慧", branchLabel: "Team B", gen: "六期生" },
       { name: "毕梦媛", branchLabel: "Team E", gen: "六期生" },
       { name: "陈姣荷", branchLabel: "Team E", gen: "六期生" },
       { name: "陈倩楠", branchLabel: "Team E", gen: "六期生" },
       { name: "冯思佳", branchLabel: "Team E", gen: "六期生" },
       { name: "李诗彦", branchLabel: "Team E", gen: "六期生" },
       { name: "李想",   branchLabel: "Team E", gen: "六期生", captain: true },
       { name: "李媛媛", branchLabel: "Team E", gen: "六期生" },
       { name: "李梓",   branchLabel: "Team E", gen: "六期生" },
       { name: "林堃",   branchLabel: "Team E", gen: "六期生" },
       { name: "刘胜男", branchLabel: "Team E", gen: "六期生", vice: true },
       { name: "罗雪丽", branchLabel: "Team E", gen: "六期生" },
       { name: "马玉灵", branchLabel: "Team E", gen: "六期生" },
       { name: "苏杉杉", branchLabel: "Team E", gen: "六期生" },
       { name: "顼凘炀", branchLabel: "Team E", gen: "六期生" },
       { name: "易妍倩", branchLabel: "Team E", gen: "六期生" },
       { name: "张笑盈", branchLabel: "Team E", gen: "六期生" },
       { name: "郑一凡", branchLabel: "Team E", gen: "六期生" },
       /* 以下为分团自主招募一期生（2016-10-01/10-29 公布，考据：branch_gen_timeline.txt），
          2017.1 时点为预备生，未升格（具体升格档案后续按需调研） */
       { name: "陈逸菲", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "吴月黎", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "大李娜", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "杨一帆", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "陈雅钰", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "房蕾",   branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "葛司琪", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "黄恩茹", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "李泓瑶", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "刘闲",   branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "任心怡", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "任玥霖", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "单习文", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "石羽莎", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "孙语姗", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "王雨烜", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "叶苗苗", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "杨晔",   branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "张怀瑾", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "张韩紫陌", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "许婉玉", branchLabel: "预备生", gen: "BEJ48一期生" },
     ],
     GNZ48: [
       { name: "陈珂",   branchLabel: "Team G", gen: "五期生" },
       { name: "陈雨琪", branchLabel: "Team G", gen: "五期生" },
       { name: "杜雨微", branchLabel: "Team G", gen: "五期生" },
       { name: "高源婧", branchLabel: "Team G", gen: "五期生", vice: true },
       { name: "李沁洁", branchLabel: "Team G", gen: "五期生" },
       { name: "林嘉佩", branchLabel: "Team G", gen: "五期生" },
       { name: "刘梦雅", branchLabel: "Team G", gen: "五期生" },
       { name: "刘筱筱", branchLabel: "Team G", gen: "五期生" },
       { name: "谢蕾蕾", branchLabel: "Team G", gen: "五期生" },
       { name: "阳青颖", branchLabel: "Team G", gen: "五期生" },
       { name: "曾艾佳", branchLabel: "Team G", gen: "五期生", captain: true },
       { name: "张凯祺", branchLabel: "Team G", gen: "五期生" },
       { name: "胡怡莹", branchLabel: "Team G", gen: "六期生" },
       { name: "罗寒月", branchLabel: "Team G", gen: "六期生" },
       { name: "王馨悦", branchLabel: "Team G", gen: "六期生" },
       { name: "张琼予", branchLabel: "Team G", gen: "六期生" },
       { name: "周倩玉", branchLabel: "Team G", gen: "六期生" },
       { name: "陈慧婧", branchLabel: "Team NIII", gen: "六期生" },
       { name: "陈楠茜", branchLabel: "Team NIII", gen: "六期生" },
       { name: "陈欣妤", branchLabel: "Team NIII", gen: "六期生" },
       { name: "冯嘉希", branchLabel: "Team NIII", gen: "六期生" },
       { name: "洪静雯", branchLabel: "Team NIII", gen: "六期生" },
       { name: "刘力菲", branchLabel: "Team NIII", gen: "六期生", captain: true },
       { name: "刘倩倩", branchLabel: "Team NIII", gen: "六期生", vice: true },
       { name: "卢静",   branchLabel: "Team NIII", gen: "六期生" },
       { name: "孙馨",   branchLabel: "Team NIII", gen: "六期生" },
       { name: "唐莉佳", branchLabel: "Team NIII", gen: "六期生" },
       { name: "冼燊楠", branchLabel: "Team NIII", gen: "六期生" },
       { name: "肖文铃", branchLabel: "Team NIII", gen: "六期生" },
       { name: "熊心瑶", branchLabel: "Team NIII", gen: "六期生" },
       { name: "郑丹妮", branchLabel: "Team NIII", gen: "六期生" },
       { name: "左嘉欣", branchLabel: "Team NIII", gen: "六期生" },
       { name: "左婧媛", branchLabel: "Team NIII", gen: "六期生" },
       /* 以下为分团自主招募一期生（2016-10-01/02/23 公布，考据：branch_gen_timeline.txt），
          2017.1 时点为预备生，未升格（具体升格档案后续按需调研） */
       { name: "黄黎蓉", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "向芸",   branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "戴欣侁", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "李伊虹", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "陈桂君", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "陈梓荧", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "代玲",   branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "杜秋霖", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "刘嘉怡", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "龙亦瑞", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "农燕萍", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "王翠菲", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "王烱义", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "王偲越", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "王盈",   branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "王秭歆", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "杨可璐", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "杨媛媛", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "于珊珊", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "张心雨", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "赵欣雨", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "赵翊民", branchLabel: "预备生", gen: "GNZ48一期生" },
     ],
   },

  /* ---------------- SHY48 / CKG48 成立名单（2017「本部新章」线，开业时建卡） ----------------
     考据：branch_gen_timeline.txt（snh48wiki.top 各期生公布时间线）——
     · SHY48 一期生：2017-01-07 公布首批 18 人（次批 02-19 公布 16 人，不建卡）；
     · CKG48 一期生：2017-10-27 公布 33 人（与游戏内「首批三十三人集训」锚点一致）；
       其中孟玥与 2016 年已毕业的 SNH48 NII 孟玥重名，为避免成员卡重名不重复建卡。
     engine.deployPioneers 在对应分团开业时按本表建卡（branchLabel 预备生）。 */
   branchFoundingRoster: {
     SHY48: [
       "陈婧文", "冯译莹", "付紫琪", "关思雨", "韩家乐", "赖梓惜", "李慧", "刘娇", "刘娜",
       "卢天惠", "南琻璞", "秦玺", "孙敏", "王诗蒙", "徐静妍", "杨允涵", "赵佳蕊", "朱燕",
     ].map(n => ({ name: n, branchLabel: "预备生", gen: "SHY48一期生" })),
     CKG48: [
       "柏欣妤", "李恩锐", "李姗姗", "李泽亚", "雷宇霄", "毛译晗", "谯玉珍", "冉蔚", "田倩兰",
       "陶菀瑞", "伍寒琪", "王梦竹", "王娱博", "曾佳", "周源", "左欣", "艾芷亦", "邓倩",
       "樊曦月", "郝婧怡", "韩林芹", "黄琬璎", "林舒晴", "李瑜璇", "石勤", "田祯臻", "吴晶晶",
       "吴学雨", "夏文倩", "章宇阳", "郑阳莹", "赵泽慧",
     ].map(n => ({ name: n, branchLabel: "预备生", gen: "CKG48一期生" })),
   },

  /* ---------------- 2017 年内新加入（2017「本部新章」线用） ----------------
     史实：八期生 2017 年分批入团（4/28 首批 5 人，此后 5、6、9 月陆续追加，全年 12 人）。
     游戏内：team 暂挂 PREP（预备生），gen「八期生」，pop 由引擎按新人生成。
     【考据注】贺苏堃同为八期生（2017.09.06 公布），出于对逝者的尊重，
     游戏内不建卡、不涉及任何相关事件。
     【考据来源】snh48wiki.top 期生时间线快照（tmp/research/timeline.txt）。 */
  joining2017: [
    { month: 4, name: "郭倩芸", team: "PREP", gen: "八期生", join: "2017-04-28" },
    { month: 4, name: "文文",   team: "PREP", gen: "八期生", join: "2017-04-28" },
    { month: 4, name: "赵梦婷", team: "PREP", gen: "八期生", join: "2017-04-28" },
    { month: 4, name: "陶波尔", team: "PREP", gen: "八期生", join: "2017-04-28" },
    { month: 4, name: "孙亚萍", team: "PREP", gen: "八期生", join: "2017-04-28" },
    { month: 5, name: "金莹玥", team: "PREP", gen: "八期生", join: "2017-05-28" },
    { month: 6, name: "林歆源", team: "PREP", gen: "八期生", join: "2017-06-07" },
    { month: 9, name: "许嘉怡", team: "PREP", gen: "八期生", join: "2017-09-06" },
    { month: 9, name: "姜涵",   team: "PREP", gen: "八期生", join: "2017-09-08" },
    { month: 9, name: "王奕",   team: "PREP", gen: "八期生", join: "2017-09-08" },
    { month: 9, name: "熊沁娴", team: "PREP", gen: "八期生", join: "2017-09-08" },
    { month: 9, name: "葛佳慧", team: "PREP", gen: "八期生", join: "2017-09-10" },
  ],

  /* ---------------- 2017 年内离团 / 移籍 / 兼任变动（2017「本部新章」线用） ----------------
     【重要】本表在「2016 年末游戏内成员卡实际状态」的基础上生效：
     2016 年已因玩家决策离团/暂休的成员（引擎会自动跳过），不再重复处理。
     六期生·分团方向 47 人已随 2016 年 4·20 划入 BEJ48/GNZ48（分团简卡），
     其后续变动随分团名册处理，不逐人建卡。
     史实锚点（snh48wiki.top 离团时间线/成员履历快照 tmp/research/leave2.json、careers3.json）：
     · 2017-01/02 SHY48 一期生两批公布（18+16 人）、1·12 沈阳星梦剧院首演；
     · 2017-04-07 7SENSES 小分队成立（孔肖吟/张语格/戴萌/许佳琪/许杨玉琢/赵粤/陈琳）；
     · 2017-07-29 「我心翱翔」第四届总决选（鞠婧祎连霸）；
     · 2017-10-27 CKG48 一期生 33 人公布、重庆星梦剧院首演；刘炅然兼任 CKG48 Team K、
       王露皎移籍 CKG48 Team K。
     【v0.9.1】原 2017-12 鞠婧祎「明星殿堂」装载条目已移除：荣誉殿堂规则由 7 月总选/8 月事件驱动，
     未连霸则鞠婧祎保持在籍（不再有 12 月明星殿堂变动）。 */
  leaving2017: [
    { month: 3, name: "唐安琪", team: "NII", date: "2017-03",    type: "离团",     story: false, note: "康复后协商解约，告别舞台" },
    { month: 4, name: "冯雪莹", team: "BEJ48", date: "2017-04",   type: "退团",     story: false, note: "BEJ48" },
    { month: 4, name: "陈音",   team: "XII",  date: "2017-04",    type: "退团",     story: false },
    { month: 4, name: "王金铭", team: "HII",  date: "2017-04-08", type: "移籍SHY48", branchTeam: "SHY48", story: false, note: "加入SHY48 Team HIII" },
    { month: 5, name: "罗兰",   team: "NII",  date: "2017-05",    type: "退团",     story: false },
    { month: 5, name: "徐真",   team: "NII",  date: "2017-05",    type: "退团",     story: false },
    { month: 5, name: "邹佳佳", team: "XII",  date: "2017-05",    type: "退团",     story: false },
    { month: 8, name: "董艳芸", team: "NII",  date: "2017-08",    type: "退团",     story: false },
    { month: 8, name: "张雅梦", team: "NII",  date: "2017-08",    type: "退团",     story: false },
    { month: 9, name: "赵韩倩", team: "SII",  date: "2017-09-10", type: "暂休",     story: false, note: "学业规划" },
    { month: 10, name: "赵梦婷", team: "PREP", date: "2017-10",   type: "离团",     story: false },
    { month: 10, name: "刘炅然", team: "HII",  date: "2017-10-27", type: "兼任CKG48", story: false, note: "兼任 CKG48 Team K（保留本部在籍）" },
    { month: 10, name: "王露皎", team: "HII",  date: "2017-10-27", type: "移籍CKG48", branchTeam: "CKG48", story: false, note: "CKG48 Team K" },
    { month: 11, name: "曾艳芬", team: "NII",  date: "2017-11",    type: "退团",     story: true },
    { month: 11, name: "刘筱筱", team: "GNZ48", date: "2017-11",   type: "退团",     story: false, note: "GNZ48" },
    { month: 12, name: "沈之琳", team: "SII",  date: "2017-12",    type: "离团",     story: false },
    { month: 12, name: "王柏硕", team: "HII",  date: "2017-12",    type: "离团",     story: false },
    { month: 12, name: "周怡",   team: "NII",  date: "2017-12",    type: "离团",     story: false },
  ],

  /* ---------------- 2017 年史实节点（「本部新章」线锚点） ---------------- */
  history2017: {
    shy48Debut: "2017-01-12",     // SHY48 沈阳星梦剧院首演（一期生 1/7、2/19 两批共 34 人）
    s7senses: "2017-04-07",       // 7SENSES 小分队成立
    electionDate: "2017-07-29",   // 「我心翱翔」第四届总决选（鞠婧祎连霸）
    fengshangDate: "2017-11-18",  // 第三届风尚大赏（戴萌 第一名）
    ckg48Debut: "2017-10-27",     // CKG48 重庆星梦剧院首演（一期生 33 人，Team K / Team C）
    electionTop5: ["鞠婧祎", "李艺彤", "黄婷婷", "冯薪朵", "陆婷"],  // 史实前五（剧情对照）
  },

  /* ---------------- 2018 年内新加入（2018「星阵重列」线用） ----------------
     史实（snh48wiki 期生时间线快照 tmp/research/timeline.txt）：
     · 2018-02-03 SNH48 九期生 12 人公布（与首次大组阁同日）；
     · 2018-07-14 十期生首位张敏淇公布（「揭面计划」升格预备生）、2018-09-09 追加 4 人；
     · 2018-11-02 十一期生首位颜沁公布；
     · 分团新期生：BEJ48 三期（2018-01-19，2人）/ SHY48 三期（2018-03-17，7人）/
       CKG48 二期（2018-04-07，8人）/ BEJ48 五期（2018-06，3人）/ CKG48 三期（2018-09-01，7人）/
       GNZ48 六期（2018-10-05，4人）/ SHY48 四期（2018-10-05，12人）/ BEJ48 六期（2018-11-08，2人）。
     本部新期生 team 挂 PREP；分团新期生带 branchTeam（引擎建分团预备生简卡）。 */
  joining2018: [
    { month: 1,  name: "杨鑫",   branchTeam: "BEJ48", gen: "BEJ48三期生", join: "2018-01-19" },
    { month: 1,  name: "周洁艺", branchTeam: "BEJ48", gen: "BEJ48三期生", join: "2018-01-19" },
    { month: 2,  name: "陈盼",     team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "李美琪",   team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "李星羽",   team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "李玉倩",   team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "王溪源",   team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "王欣颜甜甜", team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "杨令仪",   team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "杨美琪",   team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "张茜",     team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "张馨月",   team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "周诗雨",   team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 2,  name: "朱小丹",   team: "PREP", gen: "九期生", join: "2018-02-03" },
    { month: 3,  name: "陈俊羽", branchTeam: "SHY48", gen: "SHY48三期生", join: "2018-03-17" },
    { month: 3,  name: "刁滢",   branchTeam: "SHY48", gen: "SHY48三期生", join: "2018-03-17" },
    { month: 3,  name: "黄嘉怡", branchTeam: "SHY48", gen: "SHY48三期生", join: "2018-03-17" },
    { month: 3,  name: "李苏洪", branchTeam: "SHY48", gen: "SHY48三期生", join: "2018-03-17" },
    { month: 3,  name: "王嘉瑜", branchTeam: "SHY48", gen: "SHY48三期生", join: "2018-03-17" },
    { month: 3,  name: "王雨兰", branchTeam: "SHY48", gen: "SHY48三期生", join: "2018-03-17" },
    { month: 3,  name: "朱敏",   branchTeam: "SHY48", gen: "SHY48三期生", join: "2018-03-17" },
    { month: 4,  name: "戴紫薇", branchTeam: "CKG48", gen: "CKG48二期生", join: "2018-04-07" },
    { month: 4,  name: "吴晓桐", branchTeam: "CKG48", gen: "CKG48二期生", join: "2018-04-07" },
    { month: 4,  name: "魏小燕", branchTeam: "CKG48", gen: "CKG48二期生", join: "2018-04-07" },
    { month: 4,  name: "徐楚雯", branchTeam: "CKG48", gen: "CKG48二期生", join: "2018-04-07" },
    { month: 4,  name: "徐慧玲", branchTeam: "CKG48", gen: "CKG48二期生", join: "2018-04-07" },
    { month: 4,  name: "余梦露", branchTeam: "CKG48", gen: "CKG48二期生", join: "2018-04-07" },
    { month: 4,  name: "邹冰清", branchTeam: "CKG48", gen: "CKG48二期生", join: "2018-04-07" },
    { month: 4,  name: "周桐冉", branchTeam: "CKG48", gen: "CKG48二期生", join: "2018-04-07" },
    { month: 6,  name: "程宇璐", branchTeam: "BEJ48", gen: "BEJ48五期生", join: "2018-06-07" },
    { month: 6,  name: "李丽满", branchTeam: "BEJ48", gen: "BEJ48五期生", join: "2018-06-07" },
    { month: 6,  name: "任蔓琳", branchTeam: "BEJ48", gen: "BEJ48五期生", join: "2018-06-21" },
    { month: 7,  name: "张敏淇", team: "PREP", gen: "十期生", join: "2018-07-14" },
    { month: 9,  name: "曹露丹", branchTeam: "CKG48", gen: "CKG48三期生", join: "2018-09-01" },
    { month: 9,  name: "方琪",   branchTeam: "CKG48", gen: "CKG48三期生", join: "2018-09-01" },
    { month: 9,  name: "郭爽",   branchTeam: "CKG48", gen: "CKG48三期生", join: "2018-09-01" },
    { month: 9,  name: "康兆薇", branchTeam: "CKG48", gen: "CKG48三期生", join: "2018-09-01" },
    { month: 9,  name: "彭榆涵", branchTeam: "CKG48", gen: "CKG48三期生", join: "2018-09-01" },
    { month: 9,  name: "田密",   branchTeam: "CKG48", gen: "CKG48三期生", join: "2018-09-01" },
    { month: 9,  name: "赵思雨", branchTeam: "CKG48", gen: "CKG48三期生", join: "2018-09-01" },
    { month: 9,  name: "刘洁",   team: "PREP", gen: "十期生", join: "2018-09-09" },
    { month: 9,  name: "栾嘉仪", team: "PREP", gen: "十期生", join: "2018-09-09" },
    { month: 9,  name: "周睿林", team: "PREP", gen: "十期生", join: "2018-09-09" },
    { month: 9,  name: "鲁静萍", team: "PREP", gen: "十期生", join: "2018-09-09" },
    { month: 10, name: "邓熳慧", branchTeam: "GNZ48", gen: "GNZ48六期生", join: "2018-10-05" },
    { month: 10, name: "叶舒淇", branchTeam: "GNZ48", gen: "GNZ48六期生", join: "2018-10-05" },
    { month: 10, name: "鄢羽蝶", branchTeam: "GNZ48", gen: "GNZ48六期生", join: "2018-10-05" },
    { month: 10, name: "张润",   branchTeam: "GNZ48", gen: "GNZ48六期生", join: "2018-10-05" },
    { month: 10, name: "程一",   branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "卞佳宁", branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "冯嘉宝", branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "黄逸",   branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "刘宇晴", branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "尚官",   branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "王秋茹", branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "王永祺", branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "王梓",   branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "武晓迪", branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 10, name: "张瑾瑜", branchTeam: "SHY48", gen: "SHY48四期生", join: "2018-10-05" },
    { month: 11, name: "颜沁",   team: "PREP", gen: "十一期生", join: "2018-11-02" },
    { month: 11, name: "张语倩", branchTeam: "BEJ48", gen: "BEJ48六期生", join: "2018-11-08" },
    { month: 11, name: "李海淋", branchTeam: "BEJ48", gen: "BEJ48六期生", join: "2018-11-08" },
  ],

  /* ---------------- 2018 年内离团 / 移籍 / 兼任变动（2018「星阵重列」线用） ----------------
     在「2017 年末游戏内成员卡实际状态」基础上生效（已离团/暂休者引擎自动跳过）。
     史实锚点（snh48wiki 离团时间线快照 tmp/research/leave2.json，2018 全年 78 条；
     分团期生 gen 快照原文不带团名，已按游戏内口径补前缀）：
     · 2018-02-03 首次大组阁（Team XII 解散/Team Ft 成立的史实节点——游戏内由主线①组阁
       交互承载，成员变动后续实装时处理，本表不预挂）；
     · 2018-06 赵嘉敏正式毕业（仅史实官司暂休路线：zhaoMin17=freeze；学业线归队后
       在籍至 2020-10，引擎特判 zjmFreezeRoute）。
     【考据注】于珊珊（GNZ48 一期生，2018-01 病逝）：出于对逝者的尊重，不挂载、不涉及。
     type 口径：本部正式队员=毕业 / 预备生=离团 / 分团成员=退团。 */
  leaving2018: [
    { month: 1,  name: "龚诗淇", date: "2018-01", type: "毕业", story: false, note: "二期生" },
    { month: 1,  name: "吴燕文", date: "2018-01", type: "离团", story: false, note: "三期生（预备生）" },
    { month: 1,  name: "刘梦雅", date: "2018-01", type: "毕业", story: false, note: "五期生" },
    { month: 2,  name: "袁航",   date: "2018-02", type: "毕业", story: false, note: "五期生" },
    { month: 2,  name: "林歆源", date: "2018-02", type: "离团", story: false, note: "八期生（预备生）" },
    { month: 2,  name: "张文静", date: "2018-02", type: "毕业", story: false, note: "五期生" },
    { month: 2,  name: "黄彤扬", date: "2018-02", type: "毕业", story: false, note: "六期生" },
    { month: 2,  name: "吕梦莹", date: "2018-02", type: "毕业", story: false, note: "六期生" },
    { month: 2,  name: "周源",   date: "2018-02", type: "退团", story: false, note: "CKG48一期生" },
    { month: 3,  name: "严佼君", date: "2018-03", type: "毕业", story: false, note: "五期生" },
    { month: 3,  name: "林忆宁", date: "2018-03", type: "毕业", story: false, note: "六期生" },
    { month: 3,  name: "姚祎纯", date: "2018-03", type: "离团", story: false, note: "七期生（预备生）" },
    { month: 3,  name: "张凯祺", date: "2018-03", type: "毕业", story: false, note: "五期生" },
    { month: 3,  name: "秦玺",   date: "2018-03", type: "退团", story: false, note: "SHY48一期生" },
    { month: 3,  name: "石羽莎", date: "2018-03", type: "退团", story: false, note: "BEJ48一期生" },
    { month: 3,  name: "石勤",   date: "2018-03", type: "退团", story: false, note: "CKG48一期生" },
    { month: 3,  name: "郑阳莹", date: "2018-03", type: "退团", story: false, note: "CKG48一期生" },
    { month: 4,  name: "李晶",   date: "2018-04", type: "毕业", story: false, note: "四期生" },
    { month: 5,  name: "李泽亚", date: "2018-05", type: "退团", story: false, note: "CKG48一期生" },
    { month: 5,  name: "宋思娴", date: "2018-05", type: "毕业", story: false, note: "五期生" },
    { month: 6,  name: "赵嘉敏", date: "2018-06", type: "毕业", story: true, note: "合约期满毕业，专注影视（仅史实官司暂休路线生效；学业线归队后在籍至2020-10）" },
    { month: 6,  name: "李清扬", date: "2018-06", type: "毕业", story: false, note: "三期生（预备生）" },
    { month: 7,  name: "罗雪丽", date: "2018-07", type: "毕业", story: false, note: "六期生" },
    { month: 7,  name: "汪束",   date: "2018-07", type: "毕业", story: false, note: "四期生" },
    { month: 8,  name: "郝婉晴", date: "2018-08", type: "毕业", story: false, note: "三期生" },
    { month: 8,  name: "郭倩芸", date: "2018-08", type: "毕业", story: false, note: "八期生" },
    { month: 8,  name: "李媛媛", date: "2018-08", type: "毕业", story: false, note: "六期生" },
    { month: 8,  name: "李伊虹", date: "2018-08", type: "退团", story: false, note: "GNZ48一期生" },
    { month: 8,  name: "李恩锐", date: "2018-08", type: "退团", story: false, note: "CKG48一期生" },
    { month: 8,  name: "陈梓荧", date: "2018-08", type: "退团", story: false, note: "GNZ48一期生" },
    { month: 8,  name: "张馨月", date: "2018-08", type: "离团", story: false, note: "九期生（预备生）" },
    { month: 9,  name: "陈雨琪", date: "2018-09", type: "毕业", story: false, note: "五期生" },
    { month: 9,  name: "刘佩鑫", date: "2018-09", type: "毕业", story: false, note: "三期生" },
    { month: 9,  name: "曾晓雯", date: "2018-09", type: "毕业", story: false, note: "七期生" },
    { month: 9,  name: "刘菊子", date: "2018-09", type: "毕业", story: false, note: "七期生" },
    { month: 9,  name: "夏文倩", date: "2018-09", type: "退团", story: false, note: "CKG48一期生" },
    { month: 9,  name: "章宇阳", date: "2018-09", type: "退团", story: false, note: "CKG48一期生" },
    { month: 10, name: "赵晔",   date: "2018-10", type: "毕业", story: false, note: "三期生" },
    { month: 10, name: "陈问言", date: "2018-10", type: "毕业", story: false, note: "二期生" },
    { month: 10, name: "杨韫玉", date: "2018-10", type: "毕业", story: false, note: "四期生" },
    { month: 10, name: "刘瀛",   date: "2018-10", type: "离团", story: false, note: "七期生（预备生）" },
    { month: 10, name: "徐诗琪", date: "2018-10", type: "离团", story: false, note: "七期生（预备生）" },
    { month: 10, name: "刘娜",   date: "2018-10", type: "退团", story: false, note: "SHY48一期生" },
    { month: 10, name: "刘娇",   date: "2018-10", type: "退团", story: false, note: "SHY48一期生" },
    { month: 11, name: "李想",   date: "2018-11", type: "毕业", story: false, note: "六期生" },
    { month: 11, name: "成珏",   date: "2018-11", type: "毕业", story: false, note: "六期生" },
    { month: 11, name: "陈慧婧", date: "2018-11", type: "毕业", story: false, note: "六期生" },
    { month: 11, name: "王溪源", date: "2018-11", type: "离团", story: false, note: "九期生（预备生）" },
    { month: 12, name: "陶菀瑞", date: "2018-12", type: "退团", story: false, note: "CKG48一期生" },
    { month: 12, name: "陶波尔", date: "2018-12", type: "毕业", story: false, note: "八期生" },
  ],

  /* ---------------- 2018 年史实节点（「星阵重列」线锚点） ---------------- */
  history2018: {
    reorgDate: "2018-02-03",      // 首次全团大组阁（九期生同日公布；Team Ft 成立的史实节点）
    electionDate: "2018-07-28",   // 「砥砺前行」第五届总决选（李艺彤第一，终结连霸）
    ftDebut: "2018-03-23",        // Team Ft《梦想的旗帜》首演（组阁后新体制首个新公演）
    ftShuangmian: "2018-09-01",   // Team Ft《双面偶像》首演（与主线④复刻联动）
    electionTop5: ["李艺彤", "黄婷婷", "冯薪朵", "陆婷", "莫寒"],  // 史实前五（剧情对照）
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
