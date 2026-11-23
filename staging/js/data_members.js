/* ============================================================================
   data_members.js — 成员名单数据（2016 年 1 月在籍快照 + 全年变动）
   ----------------------------------------------------------------------------
   【数据来源】snh48wiki.top（SNH48中文维基）成员档案页 / 期生时间线 / 离团时间线 /
              历届总决选页，关键日期经两处以上交叉验证（调研于 2026-09-17）。
              【考据规则】Agent 不联网考据（实测访问 snh48wiki 易失败/漏失）；史实细节
              由用户手动查证后给出口径，更新时按用户口径挂载并修正相关注释——
              详见项目根目录 AGENTS.md「考据规则」。
              另参考：百度百科（总决选条目）、SNH48 官网活动页、中国日报/凤凰网
              （BEJ48/GNZ48 成立报道）。
   【同人声明】名单与日期仅作同人游戏考据用途；人气值(pop)是游戏性设定（以
              2015 年第二届总决选名次为主基准加工而成），不代表真实人气，
              亦不代表对任何成员的评价。如与史实有出入，以维基为准。
   ----------------------------------------------------------------------------
   数据结构：
     DATA.teams        各队元信息（成立日期、队徽色）
     DATA.members      2016-01-01 在籍 116 人（id/name/team/gen/join/pop/captain/note）
     DATA.joining2016  2016 年内新入团成员（六期生 3 月、六期分团方向 4 月、
                       七期生 9/10 月、BEJ48/GNZ48 一期生 10 月）
     DATA.leaving2016  2016 年内离团/暂休/移籍事件（引擎按月触发剧情）
     DATA.leaving2019  2019 年内离团事件（2019「双岸」线，引擎按月触发）
     DATA.leaving2020  2020 年内离团事件（2020「共渡」线，引擎按月触发）
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

    // ======== Team XII（34人，全部五期生，2015-12-04 入队，首任队长 9 月才任命） ========
    /* 【v0.14.6（用户口径）】杜雨微不再建卡（出于对逝者的尊重）：成员卡、
       branchMovers.GNZ、branchRoster2017.GNZ48 均已移除，全年不再出现。 */
    { id: "zengaijia",   name: "曾艾佳", team: "XII", gen: "五期生", join: "2015-07-25", pop: 36 },
    { id: "chenke",      name: "陈珂",   team: "XII", gen: "五期生", join: "2015-07-25", pop: 38 },
    { id: "chenmeijun",  name: "陈美君", team: "XII", gen: "五期生", join: "2015-07-25", pop: 30 },
    { id: "chenyin",     name: "陈音",   team: "XII", gen: "五期生", join: "2015-07-25", pop: 22 },
    { id: "chenyuqi",    name: "陈雨琪", team: "XII", gen: "五期生", join: "2015-07-25", pop: 24 },
    { id: "chenyunling", name: "陈韫凌", team: "XII", gen: "五期生", join: "2015-07-25", pop: 26 },
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

    /* ---------------- 影视部签约艺人（开档即带，用户口径 2026-XX） ----------------
       【备注说明（用户口径）】非准确考据——依据丝芭自制剧出境和前官网消息整理，
       仅收录女艺人；括号内为其最高学历毕业院校（记入 note）。非偶像体系出身：
       team=HALL、hall/film 双标记——不参选总选、不入新人榜/队籍排班，
       供影视部投资点将；人气值为游戏性设定（Agent 拟定，可调）。 */
    { id: "baixinyi",  name: "白昕怡", team: "HALL", gen: "影视部签约艺人", pop: 62, hall: true, film: true, note: "影视部（非偶像体系出身；毕业于山东艺术学院）" },
    { id: "gaorong",   name: "高榕",   team: "HALL", gen: "影视部签约艺人", pop: 56, hall: true, film: true, note: "影视部（非偶像体系出身；毕业于浙江传媒学院）" },
    { id: "guansuer",  name: "管素儿", team: "HALL", gen: "影视部签约艺人", pop: 60, hall: true, film: true, note: "影视部（非偶像体系出身；毕业于上海戏剧学院）" },
    { id: "guotianqi", name: "郭天祺", team: "HALL", gen: "影视部签约艺人", pop: 64, hall: true, film: true, note: "影视部（非偶像体系出身；毕业于北京电影学院）" },
    { id: "huawen",    name: "华雯",   team: "HALL", gen: "影视部签约艺人", pop: 68, hall: true, film: true, note: "影视部（非偶像体系出身；毕业于北京电影学院）" },
    { id: "wangzijia", name: "王子甲", team: "HALL", gen: "影视部签约艺人", pop: 55, hall: true, film: true, note: "影视部（非偶像体系出身；毕业于武汉大学）" },
  ],

  /* ---------------- 2016 年内新加入（引擎按月加入名单） ----------------
     六期生 2016-03-26 直接入队；七期生 2016-09-15 入队；10-28 七期补充 1 人。
     【补挂建卡（用户口径 2026-XX 对话批次）】六期生·分团方向 47 人与 BEJ48/GNZ48
     一期生 43 人已全部逐人补挂（分团方向 2016-04-20 直落各队，含前批王馨悦/
     胡怡莹/周倩玉；一期生 2016-10 入团，用户口径月份精度）——原「不逐人建卡」
     口径废止。原名称疑点经用户查证（2026-XX 对话批次）确认同一卡：
     「顼渐炀」系「顼凘炀」笔误（库内口径不变）；「戴欣侁」系旧考据笔误，
     已按用户口径更正为「戴欣佚」（branchRoster2017 卡名同步更正）。 */
  joining2016: [
    { month: 3, name: "成珏",     team: "SII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "邓艳秋菲", team: "NII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "黄彤扬",   team: "NII", gen: "六期生", join: "2016-03-26" },
    { month: 3, name: "钱艺",     team: "NII", gen: "六期生", join: "2016-03-26" },
    /* 【补挂建卡（用户口径 2026-10-25）】王馨悦：SNH48六期生，2016-04-20 入团，
       直落 GNZ48 Team G（分团正式成员，非预备生）；分团官宣后方入册，
       分团主线失败则不入册。9 月离团见 leaving2016（走通用）。 */
    { month: 4, name: "王馨悦",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team G", note: "2016-04-20 GNZ48 成立即入团，直落 Team G" },
    /* 【补挂建卡（用户口径 2026-10-24）】胡怡莹：SNH48六期生（2016-03-26 同其他六期生
       同批招募），4·20 分团成立移籍 GNZ48 Team G——同王馨悦直落口径：分团官宣后方入册，
       分团主线失败则不入册。 */
    { month: 4, name: "胡怡莹",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team G", note: "2016-03 六期生同批招募，4·20 分团成立移籍 GNZ48 Team G" },
    /* 【补挂建卡（用户口径 2026-10-24，二批）】周倩玉：SNH48六期生（2016-03-26 同批招募），
       4·20 分团成立移籍 GNZ48 Team G——同胡怡莹/王馨悦直落口径；
       5 月社媒事件（m5_hyy16）处罚对象，需要独立卡位。 */
    { month: 4, name: "周倩玉",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team G", note: "2016-03 六期生同批招募，4·20 分团成立移籍 GNZ48 Team G" },
    /* 【补挂建卡（用户口径 2026-XX 对话批次）】六期生·分团方向逐人补挂（原仅
       branchRoster2017 于 2017.1 兜底补卡，2016 年内无入团卡）：2016-04-20 分团
       成立当日直落各队（分团正式成员，非预备生）；分团官宣后方入册，主线失败
       则不入册（同王馨悦直落口径）。「顼渐炀」经用户查证系「顼凘炀」笔误，
       按库内口径挂载（2026-XX 对话批次确认）。 */
    { month: 4, name: "胡博文",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team B" },
    { month: 4, name: "林溪荷",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team B" },
    { month: 4, name: "刘姝贤",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team B" },
    { month: 4, name: "牛聪聪",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team B" },
    { month: 4, name: "青钰雯",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team B" },
    { month: 4, name: "孙姗",     team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team B" },
    { month: 4, name: "文妍",     team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team B" },
    { month: 4, name: "夏越",     team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team B" },
    { month: 4, name: "张梦慧",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team B" },
    { month: 4, name: "毕梦媛",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "陈姣荷",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "陈倩楠",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "冯思佳",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "李诗彦",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "李想",     team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "李媛媛",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "李梓",     team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "林堃",     team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "刘胜男",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "罗雪丽",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "马玉灵",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "苏杉杉",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "顼凘炀",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },   // 用户口径确认：「顼渐炀」系笔误（2026-XX 对话批次）
    { month: 4, name: "易妍倩",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "张笑盈",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "郑一凡",   team: "BEJ48", gen: "六期生", join: "2016-04-20", branchTeam: "BEJ48", branchLabel: "Team E" },
    { month: 4, name: "罗寒月",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team G" },
    { month: 4, name: "张琼予",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team G" },
    { month: 4, name: "陈慧婧",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "陈楠茜",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "陈欣妤",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "冯嘉希",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "洪静雯",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "刘力菲",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "刘倩倩",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "卢静",     team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "孙馨",     team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "唐莉佳",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "肖文铃",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "冼燊楠",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "熊心瑶",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "郑丹妮",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "左嘉欣",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
    { month: 4, name: "左婧媛",   team: "GNZ48", gen: "六期生", join: "2016-04-20", branchTeam: "GNZ48", branchLabel: "Team NIII" },
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
    /* 【补挂建卡（用户口径 2026-XX 对话批次）】BEJ48/GNZ48 一期生逐人补挂：2016-10
       入团（用户口径月份精度，随分团自主招募入册为预备生）；分团 4·20 已官宣，
       当月月初直接入册。「戴欣侁」经用户查证系旧考据笔误，按用户口径更正为
       「戴欣佚」（branchRoster2017 卡名同步更正，2026-XX 对话批次确认）。 */
    { month: 10, name: "黄黎蓉", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "向芸",   team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "戴欣佚", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },   // 原考据作戴欣侁系笔误，按用户口径 2026-XX 对话批次更正
    { month: 10, name: "李伊虹", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "陈桂君", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "陈梓荧", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "代玲",   team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "杜秋霖", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "刘嘉怡", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "龙亦瑞", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "农燕萍", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "王翠菲", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生", note: "用户口径：亦作王芊诺" },
    { month: 10, name: "王炯义", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "王偲越", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "王盈",   team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "王秭歆", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "杨可璐", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "杨媛媛", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "于珊珊", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "张心雨", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "赵欣雨", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "赵翊民", team: "GNZ48", gen: "GNZ48一期生", join: "2016-10", branchTeam: "GNZ48", branchLabel: "预备生" },
    { month: 10, name: "陈逸菲", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "吴月黎", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "大李娜", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "杨一帆", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "陈雅钰", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "房蕾",   team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "葛司琪", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "黄恩茹", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "李泓瑶", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "刘闲",   team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "任心怡", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "任玥霖", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "单习文", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "石羽莎", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "孙语姗", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "王雨煊", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "叶苗苗", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "杨晔",   team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "张怀瑾", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "张韩紫陌", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
    { month: 10, name: "许婉玉", team: "BEJ48", gen: "BEJ48一期生", join: "2016-10", branchTeam: "BEJ48", branchLabel: "预备生" },
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
    /* 唐安琪：暂休不再挂离团表（时序 bug 修复 2026-10-25）——离团表在月初结算
       先于同月末的请假抉择（m3_tb16_nii）执行，refuse 路线无法拦截。
       现改为事件驱动：agree 由事件 effect 直接落地 rest；2月 skip 等未触发
       请假抉择的路线由 engine monthStart ⓪ 追补（2016年4月起 active→rest）兑底。 */
    { month: 5, name: "程文路",   team: "XII", date: "2016-05",    type: "离团",     story: false },
    { month: 6, name: "铃木玛莉亚", team: "SII", date: "2016-06-10", type: "撤销兼任", story: true, note: "AKB48 方面结束兼任，回归 AKB48" },
    /* 申月姣/刘力玮/钱艺/邓艳秋菲/张韵雯：不再挂离团表（用户口径 2026-10-25）——
       改由 2016-08「名册精简」事件（m8_layoff16）驱动：8月4人由选项 effect
       直接落地，张韵雯10月由 engine monthStart 按 flags.layoff16 追补落地；
       补偿与否随玩家选项（避免唐安琪式「离团表先行落地」时序 bug）。 */
    { month: 7, name: "赵嘉敏",   team: "SII", date: "2016-07-30", type: "暂休",     story: true, note: "第二届总决选冠军，本年未参加第三届总决选" },
    { month: 9, name: "闫明筠",   team: "X",   date: "2016-09-15", type: "移籍BEJ48", branchTeam: "BEJ48", story: false, note: "移籍 BEJ48 Team B" },
    /* 陈怡馨：2016-11 离团不再挂离团表（用户口径 2026-10-25）——改由 11月
       「专注学业」事件（m11_cyx16）驱动：解约则事件 effect 直接落地离团
       （不走通用离团），学业路线则暂休留籍。 */
    { month: 11, name: "王璐",    team: "HII", date: "2016-11",    type: "离团",     story: true, note: "Team HII 队长" },
    /* 【2016-09 新增（用户口径 2026-10-25）】徐佳丽、王馨悦离团（走通用告别）；
       王馨悦卡由 joining2016 补挂（4·20 直落 GNZ48 Team G），branchTeam 限定
       避免「分团未官宣未入册」或同名本部卡误命中。 */
    { month: 9, name: "徐佳丽",   team: "SII", date: "2016-09",    type: "离团",     story: false, note: "4·20 移籍 BEJ48 Team B 后离团" },
    { month: 9, name: "王馨悦",   team: "GNZ48", date: "2016-09",  type: "离团",     branchTeam: "GNZ48", story: false, note: "直落 GNZ48 Team G 后离团" },
  ],

  /* ---------------- 2016-04-20 分团移籍名单（分团剧情核心素材） ----------------
     史实：BEJ48/GNZ48 于 2016-04-20 宣布成立，68 人组成四队。
     游戏中：若分团主线成功，这 20 名五期生从 SNH48 名单移入分团名单；
            另有六期生·分团方向 47 人同日入队直落各队，47 人已逐人建卡
            （见 joining2016，用户口径 2026-XX 对话批次；「顼渐炀」经查证系
            「顼凘炀」笔误）。 */
  branchMovers: {
    BEJ: ["陈美君", "段艺璇", "冯雪莹", "胡晓慧", "宋思娴", "田姝丽", "熊素君", "徐佳丽", "张菡筱"],
    GNZ: ["陈珂", "陈雨琪", "高源婧", "李沁洁", "林嘉佩", "刘梦雅", "刘筱筱", "阳青颖", "曾艾佳", "张凯祺", "谢蕾蕾"],
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
     carryTo2017 按本表补建缺失的分团成员卡；已在籍的移籍成员卡（含人气/羁绊）保留不动。
     【2026-XX 对话批次】六期生·分团方向与两分团一期生已全部于 joining2016 逐人
     补挂（2016 年内入团），2017.1 走到此处时同名在籍卡自动跳过——本表保留作
     分团主线失败时的兜底与队长/副队任命同步（原「戴欣侁」已按用户口径更正为
     「戴欣佚」）。 */
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
       { name: "王雨煊", branchLabel: "预备生", gen: "BEJ48一期生" },   // 原卡名王雨烜系笔误，按用户口径 2026-10-24 更正
       { name: "叶苗苗", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "杨晔",   branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "张怀瑾", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "张韩紫陌", branchLabel: "预备生", gen: "BEJ48一期生" },
       { name: "许婉玉", branchLabel: "预备生", gen: "BEJ48一期生" },
     ],
     GNZ48: [
       { name: "陈珂",   branchLabel: "Team G", gen: "五期生" },
       { name: "陈雨琪", branchLabel: "Team G", gen: "五期生" },
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
       { name: "戴欣佚", branchLabel: "预备生", gen: "GNZ48一期生" },   // 原卡名戴欣侁系笔误，按用户口径 2026-XX 对话批次更正
       { name: "李伊虹", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "陈桂君", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "陈梓荧", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "代玲",   branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "杜秋霖", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "刘嘉怡", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "龙亦瑞", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "农燕萍", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "王翠菲", branchLabel: "预备生", gen: "GNZ48一期生" },
       { name: "王炯义", branchLabel: "预备生", gen: "GNZ48一期生" },   // 用户口径 2026-XX：主名从「烱」改「炯」（异体字口径，原考据快照作王烱义）
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
     · SHY48 一期生：2017-01-07 公布首批 18 人；次批 02-19 公布 16 人（原不建卡）——
       【用户口径 2026-XX 补挂】次批按口径补挂建卡（均为 SHY48 一期生，
       2017-02-19 入 SHY48，随开业建卡）：董思佳、高志娴、李晴、刘静晗、曲悦萌、任雨情、
       徐斐然、杨肖、张爱静、张儒轶、张幼柠、张云梦、郑洁丽、李熙凝、寇承希
       （其中杨肖/李熙凝/寇承希/张爱静此前按 2016-10 入口径补挂，现统一更正为
       2017.2 入；南琻璞系南翎璞笔误，一并改正）。次批共 16 人，另 1 人张雨晴
       不建卡（用户口径 2026-XX 对话批次确认；此前「对话批次全量补挂」口径废止）；
       杨肖离团月份按 8 月名册精简口径挂载（用户口径 2026-XX 确认）；
     · CKG48 一期生：2017-10-27 公布 33 人（与游戏内「首批三十三人集训」锚点一致），
       全量建卡；其中孟玥与 2016 年已毕业的 SNH48 NII 一期生孟玥重名——
       按用户口径（2026 补）同样建卡（id 前缀 bf17_ 区分，同名去重只挡非离团在册成员）。
       【用户口径 2026-XX 对话批次】邓倩（刘弋菡）系同一人（33 人口径含此一人）——
       卡名从刘弋菡（2021 离团挂载沿用该卡名），开业名册不再单列邓倩；
       joining2017 原单独刘弋菡补挂条目相应撤销。
     engine.deployPioneers 在对应分团开业时按本表建卡（branchLabel 预备生）。 */
   branchFoundingRoster: {
     SHY48: [
       "陈婧文", "冯译莹", "付紫琪", "关思雨", "韩家乐", "赖梓惜", "李慧", "刘娇", "刘娜",
       "卢天惠", "南翎璞", "秦玺", "孙敏", "王诗蒙", "徐静妍", "杨允涵", "赵佳蕊", "朱燕",
       /* —— 一期生次批（2017-02-19 公布）补挂 15 人（用户口径 2026-XX：均为 SHY48 一期生，
          2017-02-19 入 SHY48，随开业建卡；含此前按 2016-10 入口径补挂的 4 人，现统一更正；
          张雨晴不建卡——用户口径 2026-XX 对话批次确认）—— */
       "董思佳", "高志娴", "李晴", "刘静晗", "曲悦萌", "任雨情", "徐斐然",
       "张儒轶", "张幼柠", "张云梦", "郑洁丽",
       "杨肖", "李熙凝", "寇承希", "张爱静",
     ].map(n => ({ name: n, branchLabel: "预备生", gen: "SHY48一期生" })),
     CKG48: [
       "柏欣妤", "李恩锐", "李姗姗", "李泽亚", "雷宇霄", "毛译晗", "谯玉珍", "冉蔚", "田倩兰",
       "陶菀瑞", "伍寒琪", "王梦竹", "王娱博", "曾佳", "周源", "左欣", "艾芷亦",
       "樊曦月", "郝婧怡", "韩林芹", "黄琬璎", "林舒晴", "李瑜璇", "孟玥", "石勤", "田祯臻", "吴晶晶",
       /* 刘弋菡：报名名邓倩——邓倩（刘弋菡）系同一人（用户口径 2026-XX 对话批次），
          卡名从刘弋菡（2021 离团挂载沿用该卡名），原 joining2017 单独补挂条目撤销 */
       "吴学雨", "夏文倩", "章宇阳", "郑阳莹", "赵泽慧", "刘弋菡",
     ].map(n => ({ name: n, branchLabel: "预备生", gen: "CKG48一期生" })),
   },

  /* ---------------- 2017 年内新加入（2017「本部新章」线用） ----------------
     【用户口径 2026-XX 对话批次·2017 入团批次总表】
       01-07 SHY48 一期生 18 人 / 02-19 SHY48 一期生次批 16 人（15 人开业名册建卡，
       张雨晴不建卡——用户口径 2026-XX 对话批次确认）；
       04-20 BEJ48 二期生 15 人 / 04-28 SNH48 八期生 5 人 / 04-29 GNZ48 二期生 14 人 +
       SHY48 二期生 12 人 / 05-30 BEJ48 二期生沈小爱 / 10-01 GNZ48 三期生 13 人 /
       10-14 SHY48 三期生 4 人 / 10-27 CKG48 一期生 33 人（开业名册建卡，邓倩（刘弋菡）同一人）/
       11-10 BEJ48 三期生金鑫 / 11-11 SHY48 三期生 3 人 / 11-23 GNZ48 四期生 6 人 /
       11-25 BEJ48 三期生李宗颐、小李娜 / 11-26 BEJ48 三期生何阳青青；
       八期生：04-28 五人 / 05-28 金莹玥 / 06-07 林歆源 / 09-06 许嘉怡（贺苏堃同批，不建卡）/
       09-08 三人 / 09-10 葛佳慧。
     史实：八期生 2017 年分批入团，游戏内建卡 12 人 + 马凡（既有口径保留，未在本批口径中）。
     游戏内：team 暂挂 PREP（预备生），gen「八期生」，pop 由引擎按新人生成。
     【分团挂载】张羽涵：SHY48 二期生（2017-04-29 公布）——挂 branchTeam="SHY48"，
     引擎在 SHY48 已开业时建分团预备生简卡（与 2018 分团新期生同口径）。
     【考据注】贺苏堃同为八期生（2017-09-06 批次），出于对逝者的尊重，
     游戏内不建卡、不涉及任何相关事件。
     【考据来源】snh48wiki.top 期生时间线快照（tmp/research/timeline.txt）+ 用户口径。 */
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
    { month: 10, name: "马凡", team: "PREP", gen: "八期生", join: "2017-10" },   // 2020-01 离团（leaving2020 挂载）
    /* 【影视部签约艺人（用户口径 2026-XX）】李奕臻 2017 年到岗；到岗月份未提供，
       按年初（1 月）口径挂载——待用户补充精确月份（考据规则：宁缺毋滥不虚构） */
    { month: 1, name: "李奕臻", team: "HALL", gen: "影视部签约艺人", hall: true, film: true, pop: 60, join: "2017-01", note: "影视部（非偶像体系出身；毕业于上海视觉艺术学院）" },
    /* 【分团补挂（用户口径 2026-10-26）】BEJ48二期生李烨/郑心雨/郑依灵/李沐遥、
       GNZ48二期生陈乐添/刘小末（2017-04-29 入）——BEJ/GNZ 年初在册，按月建分团预备生简卡；
       SHY48二期生陈奕君/逯芳竹——SHY48 已开业时建卡（同张羽涵口径）。
       【日期更正（用户口径 2026-XX 对话批次）】BEJ48 二期生整批入团日为 2017-04-20
       （原挂 2017-03-11/2017-03，统一更正，month 3→4）。 */
    /* 【分团补挂（用户口径 2026-10-24，2020 离团批次配套）】GNZ48二期生张秋怡、
       SHY48三期生司珀琳（2017-10-14 入）、GNZ48四期生徐佳音（2017-11-23 入）——同上口径建分团预备生简卡。 */
    { month: 4, name: "李烨",   branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },   // 日期按用户口径 2026-XX 对话批次更正（原 2017-03-11）
    { month: 4, name: "郑心雨", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },   // 同上更正
    { month: 4, name: "郑依灵", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },   // 同上更正
    { month: 4, name: "李沐遥", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },   // 同上更正
    { month: 4, name: "陈乐添", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    { month: 4, name: "刘小末", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    { month: 4, name: "张秋怡", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },   // 用户口径 2026-10-24 补挂（日期按 2026-XX 对话批次更正）
    { month: 4, name: "陈佳莹", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生（与 SNH48 二期生陈佳莹同名双卡、非同一人——用户口径 2026-XX 对话批次）" },   // 用户口径 2026-XX 补挂（同名双卡：引擎去重/二期生安置/兼职出演事件均已按 branchTeam/gen 消歧；日期按 2026-XX 对话批次更正）
    { month: 4, name: "陈奕君", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },   // 日期按用户口径 2026-XX 对话批次更正
    { month: 4, name: "逯芳竹", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },   // 同上更正
    { month: 4, name: "张羽涵", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },   // 2020-01 退团（leaving2020 挂载）
    { month: 10, name: "司珀琳", branchTeam: "SHY48", gen: "SHY48三期生", join: "2017-10-14", note: "SHY48三期生" },   // 用户口径 2026-10-24 补挂（日期按 2026-XX 对话批次更正；SHY48 已开业时建卡）
    { month: 11, name: "徐佳音", branchTeam: "GNZ48", gen: "GNZ48四期生", join: "2017-11-23", note: "GNZ48四期生" },   // 用户口径 2026-10-24 补挂（日期按 2026-XX 对话批次更正）
    /* 【分团补挂（用户口径 2026-XX，2021 离团批次配套）】SHY48三期生唐霖（2017-11-11 入）、
       BEJ48三期生小李娜（2017-11-25 入；报名名李娜，与同队一期生「大李娜」区分，卡名从大小前缀惯例）——同上口径建分团预备生简卡。
       （CKG48一期生刘弋菡原在本表补挂——邓倩（刘弋菡）系同一人（用户口径 2026-XX 对话批次），
       改由 CKG48 开业名册建卡，本表补挂条目撤销。） */
    { month: 4,  name: "刘一菲", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },   // 用户口径 2026-XX 补挂（日期按 2026-XX 对话批次更正）
    { month: 4,  name: "金锣赛", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },   // 同上更正
    { month: 11, name: "唐霖",   branchTeam: "SHY48", gen: "SHY48三期生", join: "2017-11-11", note: "SHY48三期生" },   // 用户口径 2026-XX 补挂（日期按 2026-XX 对话批次更正）
    { month: 11, name: "小李娜", branchTeam: "BEJ48", gen: "BEJ48三期生", join: "2017-11-25", note: "BEJ48三期生；报名名李娜（与大李娜区分）" },   // 用户口径 2026-XX 补挂（日期按 2026-XX 对话批次更正）
    /* 【分团补挂（用户口径 2026-XX，2022 离团批次配套）】GNZ48二期生赖俊亦/谢艾琳（2017-04-29 入）、
       GNZ48三期生梁婉琳（2017-10-01 入）——GNZ48 年初在册，按月建分团预备生简卡。 */
    { month: 4,  name: "赖俊亦", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },   // 用户口径 2026-XX 补挂（日期按 2026-XX 对话批次更正）
    { month: 4,  name: "谢艾琳", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },   // 同上更正
    { month: 10, name: "梁婉琳", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },   // 同上更正
    /* 【用户口径 2026-XX 对话批次·全量补挂】2017 入团批次中此前未建卡成员按批次补挂；
       已有建卡渠道的成员渠道不变，仅按本批口径统一入团日期。批次明细：
       · BEJ48 二期生 2017-04-20 批（15 人口径，既有李烨/郑心雨/郑依灵/李沐遥/刘一菲/金锣赛 6 人）+ 05-30 沈小爱；
       · GNZ48 二期生 2017-04-29 批（14 人口径，既有陈乐添/刘小末/张秋怡/陈佳莹/赖俊亦/谢艾琳 6 人）；
       · SHY48 二期生 2017-04-29 批（12 人口径，既有陈奕君/逯芳竹/张羽涵 3 人）；
       · GNZ48 三期生 2017-10-01 批（13 人口径，既有梁婉琳）；
       · SHY48 三期生 2017-10-14 / 11-11 批（既有司珀琳/唐霖）；
       · GNZ48 四期生 2017-11-23 批（既有徐佳音）；
       · BEJ48 三期生 2017-11-10 / 11-25 / 11-26 批（既有小李娜；金鑫/李宗颐/何阳青青同批补挂）。
       八期生贺苏堃（2017-09-06 批）按既有口径不建卡；CKG48 一期生 33 人由开业名册建卡。 */
    // —— BEJ48 二期生 2017-04-20 批补挂 ——
    { month: 4, name: "黄子璇", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },   // 用户口径 2026-XX 对话批次补挂
    { month: 4, name: "徐静",   branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },
    { month: 4, name: "赵笛儿", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },
    { month: 4, name: "胡丽芝", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },
    { month: 4, name: "刘崇恬", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },
    { month: 4, name: "毛其羽", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },
    { month: 4, name: "孙晓艳", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },
    { month: 4, name: "兰昊",   branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },
    { month: 4, name: "乔钰珂", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-04-20", note: "BEJ48二期生" },
    { month: 5, name: "沈小爱", branchTeam: "BEJ48", gen: "BEJ48二期生", join: "2017-05-30", note: "BEJ48二期生" },
    // —— GNZ48 二期生 2017-04-29 批补挂 ——
    { month: 4, name: "陈俊宏", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    { month: 4, name: "程一心", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    { month: 4, name: "方晓瑜", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    { month: 4, name: "梁可",   branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    { month: 4, name: "朱怡欣", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    { month: 4, name: "高雪逸", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    { month: 4, name: "唐诗怡", branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    { month: 4, name: "郑悦",   branchTeam: "GNZ48", gen: "GNZ48二期生", join: "2017-04-29", note: "GNZ48二期生" },
    // —— SHY48 二期生 2017-04-29 批补挂 ——
    { month: 4, name: "菅瑞静", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },
    { month: 4, name: "叶锦童", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },
    { month: 4, name: "臧聪",   branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },
    { month: 4, name: "郑诗琪", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },
    { month: 4, name: "方诗涵", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },
    { month: 4, name: "高崇",   branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },
    { month: 4, name: "龚梦婷", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },
    { month: 4, name: "王菲妍", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },
    { month: 4, name: "王睿琦", branchTeam: "SHY48", gen: "SHY48二期生", join: "2017-04-29", note: "SHY48二期生" },
    // —— GNZ48 三期生 2017-10-01 批补挂 ——
    { month: 10, name: "毕瑞珊", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "程子钰", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "邓惠恩", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "符冰冰", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "黄楚茵", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "何梦瑶", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "罗可嘉", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "林芝",   branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "汪慕远", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "吴羽霏", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "叶晓梦", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    { month: 10, name: "余芷媛", branchTeam: "GNZ48", gen: "GNZ48三期生", join: "2017-10-01", note: "GNZ48三期生" },
    // —— SHY48 三期生 2017-10-14 / 11-11 批补挂 ——
    { month: 10, name: "李彬玉", branchTeam: "SHY48", gen: "SHY48三期生", join: "2017-10-14", note: "SHY48三期生" },
    { month: 10, name: "周佳怡", branchTeam: "SHY48", gen: "SHY48三期生", join: "2017-10-14", note: "SHY48三期生" },
    { month: 10, name: "赵天杨", branchTeam: "SHY48", gen: "SHY48三期生", join: "2017-10-14", note: "SHY48三期生" },
    { month: 11, name: "程戈",   branchTeam: "SHY48", gen: "SHY48三期生", join: "2017-11-11", note: "SHY48三期生" },
    { month: 11, name: "相望",   branchTeam: "SHY48", gen: "SHY48三期生", join: "2017-11-11", note: "SHY48三期生" },
    // —— GNZ48 四期生 2017-11-23 批补挂 ——
    { month: 11, name: "李晨曦", branchTeam: "GNZ48", gen: "GNZ48四期生", join: "2017-11-23", note: "GNZ48四期生" },
    { month: 11, name: "舒湘",   branchTeam: "GNZ48", gen: "GNZ48四期生", join: "2017-11-23", note: "GNZ48四期生" },
    { month: 11, name: "王梦媛", branchTeam: "GNZ48", gen: "GNZ48四期生", join: "2017-11-23", note: "GNZ48四期生" },
    { month: 11, name: "肖文静", branchTeam: "GNZ48", gen: "GNZ48四期生", join: "2017-11-23", note: "GNZ48四期生" },
    { month: 11, name: "张紫颖", branchTeam: "GNZ48", gen: "GNZ48四期生", join: "2017-11-23", note: "GNZ48四期生" },
    // —— BEJ48 三期生 2017-11-10 / 11-25 / 11-26 批补挂 ——
    { month: 11, name: "金鑫", branchTeam: "BEJ48", gen: "BEJ48三期生", join: "2017-11-10", note: "BEJ48三期生" },   // 用户口径 2026-XX 对话批次补挂
    { month: 11, name: "李宗颐", branchTeam: "BEJ48", gen: "BEJ48三期生", join: "2017-11-25", note: "BEJ48三期生" },
    { month: 11, name: "何阳青青", branchTeam: "BEJ48", gen: "BEJ48三期生", join: "2017-11-26", note: "BEJ48三期生" },
  ],

  /* ---------------- 2017 年内离团 / 移籍 / 兼任变动（2017「本部新章」线用） ----------------
     【重要】本表在「2016 年末游戏内成员卡实际状态」的基础上生效：
     2016 年已因玩家决策离团/暂休的成员（引擎会自动跳过），不再重复处理。
     六期生·分团方向 47 人（47 人已逐人建卡，见 joining2016）已随 2016 年 4·20
     划入 BEJ48/GNZ48，其后续变动随分团名册处理，不逐人挂离团表。
     史实锚点（snh48wiki.top 离团时间线/成员履历快照 tmp/research/leave2.json、careers3.json）：
     · 2017-01/02 SHY48 一期生两批公布（18+16 人）、1·12 沈阳星梦剧院首演；
     · 2017-04-07 7SENSES 小分队成立（孔肖吟/张语格/戴萌/许佳琪/许杨玉琢/赵粤/陈琳）；
     · 2017-07-29 「我心翱翔」第四届总决选（鞠婧祎连霸）；
     · 2017-10-27 CKG48 一期生 33 人公布、重庆星梦剧院首演；刘炅然兼任 CKG48 Team K、
       王露皎移籍 CKG48 Team K。
     【v0.9.1】原 2017-12 鞠婧祎「明星殿堂」装载条目已移除：荣誉殿堂规则由 7 月总选/8 月事件驱动，
     未连霸则鞠婧祎保持在籍（不再有 12 月明星殿堂变动）。 */
  leaving2017: [
    /* 唐安琪 2017-03 离团不再挂离团表（时序 bug 修复 2026-10-25）：离团表月初先行
       落地会导致「唐安琪的决定」抉择事件（gate 排除已离团）永不触发、只剩自动离团。
       现由 m3_17_tanqi 事件 effect 直接落地；旧档追补仍由 engine monthStart ⓪ 兑底。 */
    /* 【2017 通用离团（用户口径 2026-10-26）】note 含「名册精简」的条目不走通用离团：
       engine monthStart 登记到 layoff17Names，按卡况动态分配——本部/玩家兼任分团
       成员进 layoff17Choice 由玩家拍板是否支付补偿（10 万/人），未兼任分团成员
       自动支付（同 2016 线补偿口径）。详见 engine.applyLayoff17。
       【用户口径 2026-10-26 补挂】下述原未建卡人员已按口径建卡（SHY48一期生随
       开业建卡，其余见 joining2017 补挂条目），离团同步挂载：李烨/郑心雨（5月精简）、
       杨肖/陈乐添（8月精简）、陈奕君/郑依灵/李沐遥/刘小末/逯芳竹（10月精简）、
       樊曦月（12月精简）；南翎璞（8月通用）、李熙凝/寇承希（11月通用）。
       【用户口径 2026-XX 补挂】陈婧文（4月精简）、徐静妍（8月精简）——均为 SHY48
       一期生（次批补挂建卡），离团按名册精简口径挂载（杨肖 8 月精简已挂，未动）。 */
    { month: 2,  name: "单习文", team: "BEJ48", date: "2017-02",    type: "离团",     story: false, note: "名册精简" },
    { month: 2,  name: "毕梦媛", team: "BEJ48", date: "2017-02",    type: "离团",     story: false, note: "名册精简" },
    { month: 3,  name: "胡博文", team: "BEJ48", date: "2017-03",    type: "退团",     story: false, note: "BEJ48" },
    { month: 3,  name: "易妍倩", team: "BEJ48", date: "2017-03",    type: "退团",     story: false, note: "BEJ48" },
    { month: 4,  name: "冯雪莹", team: "BEJ48", date: "2017-04",    type: "退团",     story: false, note: "BEJ48" },
    { month: 4,  name: "陈音",   team: "XII",  date: "2017-04",    type: "退团",     story: false },
    { month: 4,  name: "林堃",   team: "BEJ48", date: "2017-04",    type: "离团",     story: false, note: "名册精简" },
    { month: 4,  name: "陈婧文", team: "SHY48", date: "2017-04",    type: "离团",     story: false, note: "名册精简" },   // 用户口径 2026-XX 补挂（SHY48一期生）
    { month: 4,  name: "王金铭", team: "HII",  date: "2017-04-08", type: "移籍SHY48", branchTeam: "SHY48", story: false, note: "加入SHY48 Team HIII" },
    { month: 5,  name: "文妍",   team: "BEJ48", date: "2017-05",    type: "退团",     story: false, note: "BEJ48" },
    { month: 5,  name: "罗兰",   team: "NII",  date: "2017-05",    type: "退团",     story: false },
    { month: 5,  name: "向芸",   team: "GNZ48", date: "2017-05",    type: "退团",     story: false, note: "GNZ48" },
    { month: 5,  name: "吴月黎", team: "BEJ48", date: "2017-05",    type: "退团",     story: false, note: "BEJ48" },
    { month: 5,  name: "徐真",   team: "NII",  date: "2017-05",    type: "退团",     story: false },
    { month: 5,  name: "李烨",   team: "BEJ48", date: "2017-05",    type: "离团",     story: false, note: "名册精简" },
    { month: 5,  name: "郑心雨", team: "BEJ48", date: "2017-05",    type: "离团",     story: false, note: "名册精简" },
    { month: 5,  name: "邹佳佳", team: "XII",  date: "2017-05",    type: "退团",     story: false },
    { month: 8,  name: "杨肖",   team: "SHY48", date: "2017-08",    type: "离团",     story: false, note: "名册精简" },
    { month: 8,  name: "徐静妍", team: "SHY48", date: "2017-08",    type: "离团",     story: false, note: "名册精简" },   // 用户口径 2026-XX 补挂（SHY48一期生）
    { month: 8,  name: "陈乐添", team: "GNZ48", date: "2017-08",    type: "离团",     story: false, note: "名册精简" },
    { month: 8,  name: "张心雨", team: "GNZ48", date: "2017-08",    type: "退团",     story: false, note: "GNZ48" },
    { month: 8,  name: "董艳芸", team: "NII",  date: "2017-08",    type: "离团",     story: false, note: "名册精简" },
    { month: 8,  name: "张雅梦", team: "NII",  date: "2017-08",    type: "退团",     story: false },
    { month: 8,  name: "赵翊民", team: "GNZ48", date: "2017-08",    type: "退团",     story: false, note: "GNZ48" },
    { month: 8,  name: "南翎璞", team: "SHY48", date: "2017-08",    type: "退团",     story: false, note: "SHY48" },
    { month: 9,  name: "赵韩倩", team: "SII",  date: "2017-09-10", type: "暂休",     story: false, note: "学业规划" },
    { month: 10, name: "陈奕君", team: "SHY48", date: "2017-10",    type: "离团",     story: false, note: "名册精简" },
    { month: 10, name: "郑依灵", team: "BEJ48", date: "2017-10",    type: "离团",     story: false, note: "名册精简" },
    { month: 10, name: "李沐遥", team: "BEJ48", date: "2017-10",    type: "离团",     story: false, note: "名册精简" },
    { month: 10, name: "刘小末", team: "GNZ48", date: "2017-10",    type: "离团",     story: false, note: "名册精简" },
    { month: 10, name: "逯芳竹", team: "SHY48", date: "2017-10",    type: "离团",     story: false, note: "名册精简" },
    { month: 10, name: "牛聪聪", team: "BEJ48", date: "2017-10",    type: "退团",     story: false, note: "BEJ48" },
    { month: 10, name: "赵梦婷", team: "PREP", date: "2017-10",   type: "离团",     story: false, note: "名册精简" },
    { month: 10, name: "刘炅然", team: "HII",  date: "2017-10-27", type: "兼任CKG48", story: false, note: "兼任 CKG48 Team K（保留本部在籍）" },
    { month: 10, name: "王露皎", team: "HII",  date: "2017-10-27", type: "移籍CKG48", branchTeam: "CKG48", story: false, note: "CKG48 Team K" },
    { month: 11, name: "刘嘉怡", team: "GNZ48", date: "2017-11",    type: "退团",     story: false, note: "GNZ48" },
    { month: 11, name: "曾艳芬", team: "NII",  date: "2017-11",    type: "退团",     story: true },
    { month: 11, name: "陈姣荷", team: "BEJ48", date: "2017-11",    type: "退团",     story: false, note: "BEJ48" },
    { month: 11, name: "刘筱筱", team: "GNZ48", date: "2017-11",   type: "退团",     story: false, note: "GNZ48" },
    { month: 11, name: "孙姗",   team: "BEJ48", date: "2017-11",    type: "退团",     story: false, note: "BEJ48" },
    { month: 11, name: "李熙凝", team: "SHY48", date: "2017-11",    type: "退团",     story: false, note: "SHY48" },
    { month: 11, name: "寇承希", team: "SHY48", date: "2017-11",    type: "退团",     story: false, note: "SHY48" },
    { month: 11, name: "沈之琳", team: "SII",  date: "2017-11",    type: "离团",     story: false },
    { month: 11, name: "周怡",   team: "NII",  date: "2017-11",    type: "离团",     story: false },
    { month: 12, name: "王柏硕", team: "HII",  date: "2017-12",    type: "离团",     story: false },
    { month: 12, name: "姜涵",   team: "PREP", date: "2017-12",    type: "离团",     story: false, note: "名册精简" },
    { month: 12, name: "许嘉怡", team: "PREP", date: "2017-12",    type: "离团",     story: false, note: "名册精简" },
    { month: 12, name: "樊曦月", team: "CKG48", date: "2017-12",    type: "离团",     story: false, note: "名册精简" },
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
       GNZ48 六期（2018-10-05，4人）/ SHY48 四期（2018-10-05，12人）/ BEJ48 六期（2018-11-08，2人）/
       GNZ48 五期（2018-04，章泽婷、谢菲菲——后者按用户口径 2026-XX 补挂，月份精度）/
       BEJ48 四期（2018-04，高蔚然、付奕萱——按用户口径 2026-XX 补挂，月份精度，
       2023 离团批次配套）。
     本部新期生 team 挂 PREP；分团新期生带 branchTeam（引擎建分团预备生简卡）。 */
  joining2018: [
    { month: 4,  name: "章泽婷", branchTeam: "GNZ48", gen: "GNZ48五期生", join: "2018-04" },   // 按用户口径 2026-XX 补挂建卡（月份精度；GNZ48 未开业则不入册）
    { month: 4,  name: "谢菲菲", branchTeam: "GNZ48", gen: "GNZ48五期生", join: "2018-04" },   // 用户口径 2026-XX 补挂建卡（2023 离团批次配套，月份精度）
    { month: 4,  name: "高蔚然", branchTeam: "BEJ48", gen: "BEJ48四期生", join: "2018-04" },   // 用户口径 2026-XX 补挂建卡（2023 离团批次配套，月份精度）
    { month: 4,  name: "付奕萱", branchTeam: "BEJ48", gen: "BEJ48四期生", join: "2018-04" },   // 用户口径 2026-XX 补挂建卡（2023 离团批次配套，月份精度）
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
    { month: 4,  name: "熊鑫",   branchTeam: "BEJ48", gen: "BEJ48四期生", join: "2018-04", note: "BEJ48四期生" },   // 用户口径 2026-10-24 补挂（2020 离团批次配套）
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
    { month: 9,  name: "戚予珠", team: "PREP", gen: "十期生", join: "2018-09-09" },
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

  /* ---------------- 2019 年度入团考据（2019 新线·主线③招新候选池） ----------------
     史实（snh48wiki.top「各期生公布时间线」官方口径，2026-10 按作者提供挂载）：
     · 2019-01-03  BEJ48 六期生 1 人：熊依依；
     · 2019-09-14  SNH48 十二期生 4 人：陈雨孜、刘丽土、江鑫、潘璐瑶（本部重启招新）；
     · 2019-09-15  GNZ48 七期生 1 人：吴思琪；
     · 2019-09-28  BEJ48 七期生 3 人：陈亿杉、曾洁、张智杰（Team E）；
     · 2019-10-25  BEJ48 七期生 2 人：宁轲、吕蕊（Team B）；
     · 2019-10-26  GNZ48 七期生 2 人：刘果、马昕玥；
     · 2019-11-17  SNH48 十三期生 1 人：张睿婕；
     · 2019-11-29  SNH48 十三期生 2 人：由淼、王贝妮；BEJ48 七期生 2 人：杜亚轩、熊文婕（Team J）。
     共 18 人为 2019 年全部入团成员（高菲儿不在官方时间线内，不挂载；
     原挂载「王见妮」系考据误记，按用户口径 2026-10-25 勘误为王贝妮）；
     史实中 BEJ48/GNZ48 七期多直接升格入队，游戏内统一按「预备生归属由总监拍板」处理。
     入线声明：2019 线不挂载 joining2019 静态表（组阁与新生加入由剧情承载），
     本表仅作 9 月招新事件候选池——归属由总监在拍板窗逐一决定（本部预备生 /
     各分团预备生 / 暂不招录）。本部候选 branch 为空，默认入本部预备生。
     【例外（用户口径 2026-XX）】十二期生刘丽千不属招新拍板池，经 joining2019
     静态补挂入预备生（见上方 joining2019；monthStart/fastSimJoinLeave 已接线）。 */
  recruit2019: [
    { name: "熊依依", branch: "BEJ48", gen: "BEJ48六期生", join: "2019-01-03" },
    { name: "陈雨孜", branch: null,     gen: "十二期生",    join: "2019-09-14" },
    { name: "刘丽土", branch: null,     gen: "十二期生",    join: "2019-09-14" },
    { name: "江鑫",   branch: null,     gen: "十二期生",    join: "2019-09-14" },
    { name: "潘璐瑶", branch: null,     gen: "十二期生",    join: "2019-09-14" },
    { name: "吴思琪", branch: "GNZ48", gen: "GNZ48七期生", join: "2019-09-15" },
    { name: "陈亿杉", branch: "BEJ48", gen: "BEJ48七期生", join: "2019-09-28" },
    { name: "曾洁",   branch: "BEJ48", gen: "BEJ48七期生", join: "2019-09-28" },
    { name: "张智杰", branch: "BEJ48", gen: "BEJ48七期生", join: "2019-09-28" },
    { name: "宁轲",   branch: "BEJ48", gen: "BEJ48七期生", join: "2019-10-25" },
    { name: "吕蕊",   branch: "BEJ48", gen: "BEJ48七期生", join: "2019-10-25" },
    { name: "刘果",   branch: "GNZ48", gen: "GNZ48七期生", join: "2019-10-26" },
    { name: "马昕玥", branch: "GNZ48", gen: "GNZ48七期生", join: "2019-10-26" },
    { name: "张睿婕", branch: null,     gen: "十三期生",    join: "2019-11-17" },
    { name: "由淼",   branch: null,     gen: "十三期生",    join: "2019-11-29" },
    { name: "王贝妮", branch: null,     gen: "十三期生",    join: "2019-11-29" },   // 原挂载「王见妮」系误记，按用户口径勘误
    { name: "杜亚轩", branch: "BEJ48", gen: "BEJ48七期生", join: "2019-11-29" },
    { name: "熊文婕", branch: "BEJ48", gen: "BEJ48七期生", join: "2019-11-29" },
  ],

  /* ---------------- 2019 年史实入团表（2021 离团批次补挂，用户口径 2026-XX） ----------------
     本部十二期生刘丽千（2019-09 入 SNH48）。注：2019 线静态入团表原本不挂载
     （招新由主线③剧情事件承载，候选池见 DATA.recruit2019，系十三期口径）；
     刘丽千系十二期生单独批次，不属招新拍板池，静态补挂入预备生。
     【影视部签约艺人（用户口径 2026-XX）】裴蕾（1月，到岗月份未提供按年初挂载）同表挂载，
     engine monthStart/fastSimJoinLeave 的 2019 joinSrc 已同步接线（共 2 条）。 */
  joining2019: [
    { month: 9,  name: "刘丽千", team: "PREP", gen: "十二期生", join: "2019-09" },
    /* 【影视部签约艺人（用户口径 2026-XX）】裴蕾 2019 年到岗；到岗月份未提供，
       按年初（1 月）口径挂载——待用户补充精确月份 */
    { month: 1, name: "裴蕾", team: "HALL", gen: "影视部签约艺人", hall: true, film: true, pop: 55, join: "2019-01", note: "影视部（非偶像体系出身；挖掘自《慕南枝》剧组；学历待考）" },
  ],

  /* ---------------- 2019 年内离团（2019「双岸」线用，v0.12.3 挂载） ----------------
     在「2018 年末游戏内成员卡实际状态」基础上生效（引擎自动跳过已离团/暂休/
     殿堂成员）；2018 年点将出征鹅厂选秀的成员不随本表离团（引擎特判，见
     engine.monthStart——封闭集训与限定团线承载她们的年内在籍）。
     type 口径沿用 leaving2018：SNH48 本部出身（含移籍分团的五期/六期生）=毕业 /
     本部预备生=离团 / 分团自主招募成员=退团。
     【不建卡忽略名单】下列 2019 年史实离团成员游戏内无成员卡，不挂载：
       楼澍、张丹丹、郭铱宁。
       【注（用户口径 2026-XX 对话批次）】原名单中刘静晗（SHY48 一期生次批）/
       陈俊宏（GNZ48 二期生）/胡丽芝（BEJ48 二期生）/毕瑞珊/何梦瑶/余芷媛（GNZ48 三期生）经
       2017 入团口径补挂后已有卡，其 2019 年离团已按用户口径补挂（月份精度，
       见下；分团自主招募出身 → type 退团）。
     【名字勘误】4月「李瑜旋」按游戏内在册卡名 李瑜璇（CKG48 一期生）挂载。 */
  leaving2019: [
    { month: 1,  name: "潘燕琦", date: "2019-01", type: "毕业", story: false, note: "七期生" },
    { month: 1,  name: "孙亚萍", date: "2019-01", type: "离团", story: false, note: "八期生（预备生）" },
    { month: 1,  name: "刘炅然", date: "2019-01", type: "毕业", story: false, note: "三期生" },
    { month: 2,  name: "杜秋霖", date: "2019-02", type: "退团", story: false, note: "GNZ48一期生" },
    { month: 2,  name: "毕瑞珊", date: "2019-02", type: "退团", story: false, note: "GNZ48三期生" },   // 用户口径 2026-XX 对话批次补挂（joining2017 建卡，无卡自动跳过）
    { month: 2,  name: "何梦瑶", date: "2019-02", type: "退团", story: false, note: "GNZ48三期生" },   // 同上
    { month: 2,  name: "李丽满", date: "2019-02", type: "退团", story: false, note: "BEJ48五期生" },
     { month: 3,  name: "章泽婷", date: "2019-03", type: "退团", story: false, note: "GNZ48五期生" },   // 按用户口径 2026-XX（通用离团；joining2018 补挂建卡，无卡自动跳过）
     { month: 3,  name: "任玥霖", date: "2019-03", type: "退团", story: false, note: "BEJ48一期生" },   // 按用户口径 2026-XX（通用离团；BEJ48 开业后建卡，未开业/无卡自动跳过）
    { month: 4,  name: "刘静晗", date: "2019-04", type: "退团", story: false, note: "SHY48一期生" },   // 用户口径 2026-XX 对话批次补挂（SHY48 开业名册建卡，未开业/无卡自动跳过）
    { month: 4,  name: "李瑜璇", date: "2019-04", type: "退团", story: false, note: "CKG48一期生" },
    { month: 5,  name: "陈俊宏", date: "2019-05", type: "退团", story: false, note: "GNZ48二期生" },   // 用户口径 2026-XX 对话批次补挂（joining2017 建卡，无卡自动跳过）
    { month: 5,  name: "余芷媛", date: "2019-05", type: "退团", story: false, note: "GNZ48三期生" },   // 同上
    { month: 6,  name: "李沁洁", date: "2019-06", type: "毕业", story: false, note: "五期生" },
    { month: 6,  name: "栾嘉仪", date: "2019-06", type: "离团", story: false, note: "十期生（预备生）" },
    { month: 6,  name: "杨令仪", date: "2019-06", type: "离团", story: false, note: "九期生（预备生）" },
    { month: 6,  name: "肖文铃", date: "2019-06", type: "毕业", story: false, note: "六期生" },
    { month: 6,  name: "左嘉欣", date: "2019-06", type: "毕业", story: false, note: "六期生" },
    { month: 6,  name: "徐晗",   date: "2019-06", type: "毕业", story: false, note: "三期生" },
    { month: 7,  name: "李美琪", date: "2019-07", type: "离团", story: false, note: "九期生（预备生）" },
    { month: 7,  name: "胡丽芝", date: "2019-07", type: "退团", story: false, note: "BEJ48二期生" },   // 用户口径 2026-XX 对话批次补挂（joining2017 建卡，无卡自动跳过）
    { month: 8,  name: "陈美君", date: "2019-08", type: "毕业", story: false, note: "五期生" },
    { month: 8,  name: "任心怡", date: "2019-08", type: "退团", story: false, note: "BEJ48一期生" },
    { month: 8,  name: "徐子轩", date: "2019-08", type: "毕业", story: false, note: "二期生" },
    { month: 8,  name: "李诗彦", date: "2019-08", type: "毕业", story: false, note: "六期生" },
    { month: 8,  name: "朱小丹", date: "2019-08", type: "离团", story: false, note: "九期生（预备生）" },
    { month: 9,  name: "房蕾",   date: "2019-09", type: "退团", story: false, note: "BEJ48一期生" },
    { month: 9,  name: "陈雅钰", date: "2019-09", type: "退团", story: false, note: "BEJ48一期生" },
    { month: 9,  name: "李梓",   date: "2019-09", type: "毕业", story: false, note: "六期生" },
    { month: 9,  name: "杨一帆", date: "2019-09", type: "退团", story: false, note: "BEJ48一期生" },
    { month: 10, name: "赖梓惜", date: "2019-10", type: "退团", story: false, note: "SHY48一期生" },
    { month: 10, name: "孙馨",   date: "2019-10", type: "毕业", story: false, note: "六期生" },
    { month: 10, name: "杨鑫",   date: "2019-10", type: "退团", story: false, note: "BEJ48三期生" },
    { month: 12, name: "谢妮",   date: "2019-12", type: "毕业", story: false, note: "三期生" },
    { month: 12, name: "张丹三", date: "2019-12", type: "毕业", story: false, note: "四期生" },
  ],

  /* ---------------- 2019 分团撤资 · 下放离团名单（用户口径 2026-XX） ----------------
     此表成员特殊处理，不走 leaving2019 通用表，由引擎按撤资决策分流落地：
     · 默认（branch19Keep=giveup，分团停运）：2019 撤资落地时随分团离团——
       不进二次组阁池、不移籍 IDFT、不占孟波保旗留任名额；
     · 玩家保住分团（branch19Keep=keep）：延迟到 2020 主线①「安置分团成员」
       （SHY48/CKG48 解散/保留旗号）落地时随分团离团——不参与上调/留任/IDFT 安置。
     成员均系 SHY48 一期生（随开业建卡；未开业无卡自动跳过）。
     快速通道同构：fastSim2019 giveup 线落地；keep 线延迟点与实跑同（安置不触发则
     不离团，同 2021 快速通道「分团旗号延续」口径）。 */
  branchDown2019: [
    "冯译莹", "付紫琪", "孙敏", "李晴", "曲悦萌", "任雨情", "徐斐然",
  ],

  /* ---------------- 2020 年内离团（2020「共渡」线用，v0.13.9 挂载） ----------------
     在「2019 年末游戏内成员卡实际状态」基础上生效（引擎自动跳过已离团/暂休/
     殿堂成员与无卡成员）。type 口径沿用 leaving2019：SNH48 本部出身=毕业 /
     本部预备生=离团 / 分团自主招募成员=退团。
     考据（snh48wiki.top 离团时间线）：
     · 马凡：本部八期生（2017-10 入团 · 预备生），2020-01 离团；
     · 张羽涵：SHY48 二期生（2017-04 入团），2020-01 退团；
     · 孟玥：CKG48 一期生（2017-10 入团），2020-02 退团（按用户口径挂载 2020-02）——
       与 2016 年已毕业的 SNH48 NII 一期生孟玥重名，两张卡并存（CKG 卡按用户口径补建）；
       branchTeam 限定命中 CKG 卡，CKG48 未开业（无卡）则自动跳过。
     · 陈亿杉、曾洁：BEJ48 七期生（2019-09-28 入团），2020-03 退团（疫情裁撤，按用户口径
       挂载 2020-03）；杜亚轩：BEJ48 七期生（2019-11-29 入团），2020-03 退团（同上）。
       三人为 2019 主线③招新候选池成员（有建卡渠道，未招录则无卡自动跳过）。
     · 2020-04 何晓玉（本部二期生）毕业；戚予珠（十期生）/陈俊羽（SHY48三期生）/
       王诗蒙（SHY48一期生）疫情裁撤；
       2020-05 周睿林（十期生·预备生）/熊沁娴（八期生·预备生）离团，易嘉爱（二期生）毕业；
       2020-06 鲁静萍（十期生）/王贝妮（十三期生，2019 招新拍板建卡，未招录则自动跳过）
       疫情裁撤；
       2020-08 宋雨珊（五期生）/汪佳翎（四期生）/冯晓菲（四期生）/江真仪（七期生）毕业，
       王欣颜甜甜（九期生）疫情裁撤；
       2020-10 陈盼（九期生·预备生）离团，张嘉予（六期生）疫情裁撤；
       2020-12 刘晨雪（十四期生·预备生，joining2020 建卡）离团，李钊（四期生）毕业。
       以上均按用户口径挂载（2026-10-25 批次）。
     【用户口径 2026-10-24 批次（通用离团 + 疫情裁撤补充挂载）】
     · 通用离团：2020-02 鄢羽蝶（GNZ48六期生）；2020-03 邓熳慧（GNZ48六期生）；
       2020-04 林溪荷（BEJ48六期生）/葛司琪（BEJ48一期生）；2020-05 黄琬璎（CKG48一期生）；
       2020-06 王雨煊（BEJ48一期生；原卡名王雨烜系笔误，按用户口径 2026-10-24 更正卡名）；
       2020-08 魏小燕（CKG48二期生）；2020-11 顼凘炀（BEJ48六期生）。
     · 疫情裁撤：2020-04 陈欣妤（GNZ48六期生）/熊文婕（BEJ48七期生，2019 招新拍板
       建卡，未招录自动跳过）/武晓迪（SHY48四期生）；2020-08 张睿怡（BEJ48八期生，
       joining2020 建卡）；2020-09 吕蕊（BEJ48七期生，同熊文婕）；
       2020-12 莫昕（GNZ48七期生，joining2020 建卡）/谢慧先（GNZ48八期生，同上）。
     · 补挂建卡后挂载（用户口径 2026-10-24 二批）：张秋怡（GNZ48二期生，2017-04-29 入，
       joining2017 补挂）/司珀琳（SHY48三期生，2017-10-14 入，joining2017 补挂）/
       徐佳音（GNZ48四期生，2017-11-23 入，joining2017 补挂）/熊鑫（BEJ48四期生，2018-04 入，
       joining2018 补挂）——离团：2020-03 张秋怡 / 2020-06 司珀琳 / 2020-07 徐佳音 / 2020-09 熊鑫。
     · 本批次条目均不写 branchTeam（无重名冲突；兼容 2019 giveup/2020 解散线
       分团卡移籍 IDFT 后 branchTeam 清空的情形，按名命中）。
     【裁撤补偿口径（动态分配，v0.13.11）】裁撤成员由引擎按卡况动态判定归属：
       本部成员或玩家兼任分团（concur17）成员 → layoff20Choice 由玩家拍板是否支付
       补偿金（15 万/人）；未兼任分团成员 → 默认自动支付。口径详见 engine.applyLayoff20。
       【补偿金口径】因受疫情影响裁撤团队人员：默认公司支付补偿金 15 万/人
       （资金支出，士气+2 体面转身）；玩家兼任 BEJ48（flags.concur17.BEJ48，2016
       「下一站」选 BEJ48）时由 3 月剧情事件 layoff20 拍板是否支付——不支付则
       省下资金，但士气-4 热度-3，BEJ48 在册成员每人羁绊-4（见 engine.applyLayoff20）。
     若两人游戏内无卡（2017 线八期生建卡在 joining2017；SHY48 未开业则张羽涵
     不入册），离团自动跳过。 */
  leaving2020: [
    { month: 1,  name: "马凡",   date: "2020-01", type: "离团", story: false, note: "八期生（预备生）" },
    { month: 1,  name: "张羽涵", branchTeam: "SHY48", date: "2020-01", type: "退团", story: false, note: "SHY48二期生" },
    { month: 2,  name: "孟玥",   branchTeam: "CKG48", date: "2020-02", type: "退团", story: false, note: "CKG48一期生" },
    { month: 2,  name: "鄢羽蝶", date: "2020-02", type: "退团", story: false, note: "GNZ48六期生" },   // 用户口径 2026-10-24（通用离团）
    { month: 3,  name: "陈亿杉", branchTeam: "BEJ48", date: "2020-03", type: "退团", story: false, note: "BEJ48七期生（疫情裁撤）" },
    { month: 3,  name: "曾洁",   branchTeam: "BEJ48", date: "2020-03", type: "退团", story: false, note: "BEJ48七期生（疫情裁撤）" },
    { month: 3,  name: "杜亚轩", branchTeam: "BEJ48", date: "2020-03", type: "退团", story: false, note: "BEJ48七期生（疫情裁撤）" },
    { month: 3,  name: "邓熳慧", date: "2020-03", type: "退团", story: false, note: "GNZ48六期生" },   // 用户口径 2026-10-24（通用离团）
    { month: 3,  name: "张秋怡", date: "2020-03", type: "退团", story: false, note: "GNZ48二期生" },   // 用户口径 2026-10-24 二批（joining2017 补挂建卡）
    { month: 4,  name: "何晓玉", date: "2020-04", type: "毕业", story: false, note: "二期生" },
    { month: 4,  name: "戚予珠", date: "2020-04", type: "离团", story: false, note: "十期生（疫情裁撤）" },
    { month: 4,  name: "陈俊羽", branchTeam: "SHY48", date: "2020-04", type: "退团", story: false, note: "SHY48三期生（疫情裁撤）" },
    { month: 4,  name: "王诗蒙", branchTeam: "SHY48", date: "2020-04", type: "退团", story: false, note: "SHY48一期生（疫情裁撤）" },
    { month: 4,  name: "林溪荷", date: "2020-04", type: "退团", story: false, note: "BEJ48六期生" },   // 以下 5 人：用户口径 2026-10-24 批次
    { month: 4,  name: "葛司琪", date: "2020-04", type: "退团", story: false, note: "BEJ48一期生" },
    { month: 4,  name: "陈欣妤", date: "2020-04", type: "退团", story: false, note: "GNZ48六期生（疫情裁撤）" },
    { month: 4,  name: "熊文婕", date: "2020-04", type: "退团", story: false, note: "BEJ48七期生（疫情裁撤）" },   // 2019 招新拍板建卡，未招录自动跳过
    { month: 4,  name: "武晓迪", date: "2020-04", type: "退团", story: false, note: "SHY48四期生（疫情裁撤）" },
    { month: 5,  name: "周睿林", date: "2020-05", type: "离团", story: false, note: "十期生（预备生）" },
    { month: 5,  name: "熊沁娴", date: "2020-05", type: "离团", story: false, note: "八期生（预备生）" },
    { month: 5,  name: "易嘉爱", date: "2020-05", type: "毕业", story: false, note: "二期生" },
    { month: 5,  name: "黄琬璎", date: "2020-05", type: "退团", story: false, note: "CKG48一期生" },   // 用户口径 2026-10-24（通用离团）
    { month: 6,  name: "鲁静萍", date: "2020-06", type: "离团", story: false, note: "十期生（疫情裁撤）" },
    { month: 6,  name: "王贝妮", date: "2020-06", type: "离团", story: false, note: "十三期生（疫情裁撤）" },   // 十三期生走 2019 招新拍板建卡，未招录则自动跳过
    { month: 6,  name: "王雨煊", date: "2020-06", type: "退团", story: false, note: "BEJ48一期生" },   // 用户口径 2026-10-24（通用离团；卡名已由王雨烜更正）
    { month: 6,  name: "司珀琳", date: "2020-06", type: "退团", story: false, note: "SHY48三期生" },   // 用户口径 2026-10-24 二批（joining2017 补挂建卡）
    { month: 7,  name: "徐佳音", date: "2020-07", type: "退团", story: false, note: "GNZ48四期生" },   // 用户口径 2026-10-24 二批（joining2017 补挂建卡）
    { month: 8,  name: "宋雨珊", date: "2020-08", type: "毕业", story: false, note: "五期生" },
    { month: 8,  name: "汪佳翎", date: "2020-08", type: "毕业", story: false, note: "四期生" },
    { month: 8,  name: "冯晓菲", date: "2020-08", type: "毕业", story: false, note: "四期生" },
    { month: 8,  name: "江真仪", date: "2020-08", type: "毕业", story: false, note: "七期生" },
    { month: 8,  name: "王欣颜甜甜", date: "2020-08", type: "离团", story: false, note: "九期生（疫情裁撤）" },
    { month: 8,  name: "魏小燕", date: "2020-08", type: "退团", story: false, note: "CKG48二期生" },   // 用户口径 2026-10-24（通用离团）
    { month: 8,  name: "张睿怡", date: "2020-08", type: "退团", story: false, note: "BEJ48八期生（疫情裁撤）" },   // joining2020 建卡
    { month: 9,  name: "吕蕊",   date: "2020-09", type: "退团", story: false, note: "BEJ48七期生（疫情裁撤）" },   // 2019 招新拍板建卡，未招录自动跳过
    { month: 9,  name: "熊鑫",   date: "2020-09", type: "退团", story: false, note: "BEJ48四期生" },   // 用户口径 2026-10-24 二批（joining2018 补挂建卡）
    { month: 10, name: "陈盼",   date: "2020-10", type: "离团", story: false, note: "九期生（预备生）" },
    { month: 10, name: "张嘉予", date: "2020-10", type: "离团", story: false, note: "六期生（疫情裁撤）" },
    { month: 11, name: "顼凘炀", date: "2020-11", type: "退团", story: false, note: "BEJ48六期生" },   // 用户口径 2026-10-24（通用离团）
    { month: 12, name: "刘晨雪", date: "2020-12", type: "离团", story: false, note: "十四期生（疫情裁撤）" },
    { month: 12, name: "李钊",   date: "2020-12", type: "毕业", story: false, note: "四期生" },
    { month: 12, name: "莫昕",   date: "2020-12", type: "退团", story: false, note: "GNZ48七期生（疫情裁撤）" },   // joining2020 建卡；以下 2 人：用户口径 2026-10-24 批次
    { month: 12, name: "谢慧先", date: "2020-12", type: "退团", story: false, note: "GNZ48八期生（疫情裁撤）" },
  ],

  /* ---------------- 2021 年史实离团表（2021「春潮」线，引擎按月触发） ----------------
     【按用户口径挂载（2026-XX，月份精度）】两类：
     ①成员精简（同 2020 线设计）：note 含「成员精简」的条目不走通用离团，
       engine monthStart 登记到 layoff21Names，按卡况动态分配——本部/玩家兼任分团
       成员进 layoff21Choice 由玩家拍板是否支付补偿（15 万/人，同 2020 口径），
       未兼任分团成员自动支付。详见 engine.applyLayoff21。
     ②通用离团：type="离团" 直接落地（left）。
     【无卡跳过】原无卡 6 人已按用户口径补挂建卡（刘一菲/金锣赛/唐霖/小李娜[报名名李娜]：
     joining2017 补挂——邓倩（刘弋菡）系同一人（用户口径 2026-XX 对话批次），刘弋菡改由
     CKG48 一期生开业名册建卡；刘丽千 joining2019 补挂），离团正常落地；
     分团未开业（SHY/CKG 未点开）或旧档未及建卡者仍自动跳过。
     【在籍保障】张冉冉为 2021-04 十五期生（joining2021 建卡），2021-08 随精简离团；
     其余分团/预备生出身的成员由对应年份建卡表承载在籍，无卡自动跳过。 */
  leaving2021: [
    /* —— 成员精简（同 2020 线裁撤设计，动态分配 + 补偿拍板） —— */
    { month: 1,  name: "涂秀文", date: "2021-01", type: "离团", story: false, note: "成员精简（CKG48四期生）" },
    { month: 3,  name: "余芸萱", date: "2021-03", type: "离团", story: false, note: "成员精简（CKG48四期生）" },
    { month: 3,  name: "刘一菲", date: "2021-03", type: "离团", story: false, note: "成员精简" },
    { month: 3,  name: "王雨兰", date: "2021-03", type: "离团", story: false, note: "成员精简（SHY48三期生）" },
    { month: 4,  name: "李玉倩", date: "2021-04", type: "离团", story: false, note: "成员精简（九期生）" },
    { month: 4,  name: "冯雨停", date: "2021-04", type: "离团", story: false, note: "成员精简（十四期生）" },
    { month: 5,  name: "赵嘉丽", date: "2021-05", type: "离团", story: false, note: "成员精简（BEJ48九期生）" },
    { month: 5,  name: "姜欣瑶", date: "2021-05", type: "离团", story: false, note: "成员精简（GNZ48九期生）" },
    { month: 6,  name: "陆叶卉", date: "2021-06", type: "离团", story: false, note: "成员精简（十四期生）" },
    { month: 6,  name: "邓歆玥", date: "2021-06", type: "离团", story: false, note: "成员精简（十四期生）" },
    { month: 8,  name: "黄妍菲", date: "2021-08", type: "离团", story: false, note: "成员精简（BEJ48九期生）" },
    { month: 8,  name: "胡雪迎", date: "2021-08", type: "离团", story: false, note: "成员精简（BEJ48九期生）" },
    { month: 8,  name: "张冉冉", date: "2021-08", type: "离团", story: false, note: "成员精简（十五期生）" },
    { month: 10, name: "卞楚娴", date: "2021-10", type: "离团", story: false, note: "成员精简（十四期生）" },
    { month: 11, name: "王琰",   date: "2021-11", type: "离团", story: false, note: "成员精简（GNZ48九期生）" },
    { month: 11, name: "李星彦", date: "2021-11", type: "离团", story: false, note: "成员精简（十四期生）" },
    /* —— 通用离团 —— */
    { month: 3,  name: "程宇璐", date: "2021-03", type: "离团", story: false, note: "通用离团（BEJ48五期生）" },
    { month: 3,  name: "郑一凡", date: "2021-03", type: "离团", story: false, note: "通用离团（BEJ48六期生）" },
    { month: 3,  name: "邹冰清", date: "2021-03", type: "离团", story: false, note: "通用离团（CKG48二期生）" },
    { month: 3,  name: "王梦竹", date: "2021-03", type: "离团", story: false, note: "通用离团" },
    { month: 4,  name: "李泓瑶", date: "2021-04", type: "离团", story: false, note: "通用离团（BEJ48一期生）" },
    { month: 4,  name: "小李娜", date: "2021-04", type: "离团", story: false, note: "通用离团（BEJ48三期生；报名名李娜）" },
    { month: 4,  name: "李星羽", date: "2021-04", type: "离团", story: false, note: "通用离团（九期生）" },
    { month: 4,  name: "唐霖",   date: "2021-04", type: "离团", story: false, note: "通用离团" },
    { month: 4,  name: "熊心瑶", date: "2021-04", type: "离团", story: false, note: "通用离团（GNZ48六期生）" },
    { month: 6,  name: "林嘉佩", date: "2021-06", type: "离团", story: false, note: "通用离团（五期生）" },
    { month: 7,  name: "尚官",   date: "2021-07", type: "离团", story: false, note: "通用离团（SHY48四期生）" },
    { month: 8,  name: "刘弋菡", date: "2021-08", type: "离团", story: false, note: "通用离团" },
    { month: 8,  name: "刘丽千", date: "2021-08", type: "离团", story: false, note: "通用离团" },
    { month: 8,  name: "林楠",   date: "2021-08", type: "离团", story: false, note: "通用离团（三期生）" },
    { month: 8,  name: "温晶婕", date: "2021-08", type: "离团", story: false, note: "通用离团（二期生）" },
    { month: 8,  name: "袁雨桢", date: "2021-08", type: "离团", story: false, note: "通用离团（二期生）" },
    { month: 10, name: "左欣",   date: "2021-10", type: "离团", story: false, note: "通用离团" },
    { month: 10, name: "田倩兰", date: "2021-10", type: "离团", story: false, note: "通用离团" },
    { month: 10, name: "谯玉珍", date: "2021-10", type: "离团", story: false, note: "通用离团" },
    { month: 10, name: "金锣赛", date: "2021-10", type: "离团", story: false, note: "通用离团" },
    { month: 10, name: "张怡",   date: "2021-10", type: "离团", story: false, note: "通用离团（五期生）" },
    { month: 11, name: "刁滢",   date: "2021-11", type: "离团", story: false, note: "通用离团（SHY48三期生）" },
  ],

  /* ---------------- 2020 年史实入团表（2020「共渡」线，引擎按月建卡） ----------------
     考据：snh48wiki.top 期生时间线（疫情年：1~3月仅 GNZ48 七期 1 人，云招新从4月起恢复）。
     分团新期生（GNZ48/BEJ48/CKG48）挂 branchTeam：引擎建分团预备生简卡（同 2018 口径）。
     【名字勘误】BEJ48 八期 王丹妮：报名名王若诗蓝，后更名王丹妮（备注登记）。
     【补挂】CKG48 四期 潘颖（2020-09 入，用户口径 2026-XX 补挂建卡，月份精度；
     2023-01 通用离团批次配套）。 */
   joining2020: [
     { month: 1,  name: "莫昕",     branchTeam: "GNZ48", gen: "GNZ48 七期生", join: "2020-01-01" },
     { month: 4,  name: "王丹妮",   branchTeam: "BEJ48", gen: "BEJ48 八期生", join: "2020-04-20", note: "曾用名王若诗蓝" },
     { month: 4,  name: "张睿怡",   branchTeam: "BEJ48", gen: "BEJ48 八期生", join: "2020-04-20" },
     { month: 6,  name: "石竹君",   branchTeam: "GNZ48", gen: "GNZ48 八期生", join: "2020-06-13" },
     { month: 6,  name: "杨若惜",   branchTeam: "GNZ48", gen: "GNZ48 八期生", join: "2020-06-13" },
     { month: 6,  name: "张书瑀",   branchTeam: "GNZ48", gen: "GNZ48 八期生", join: "2020-06-13" },
     { month: 6,  name: "梁晶金",   branchTeam: "CKG48", gen: "CKG48 四期生", join: "2020-06-27" },
     { month: 6,  name: "涂秀文",   branchTeam: "CKG48", gen: "CKG48 四期生", join: "2020-06-27" },
     { month: 6,  name: "余芸萱",   branchTeam: "CKG48", gen: "CKG48 四期生", join: "2020-06-27" },
     { month: 8,  name: "陈妮亚",   branchTeam: "CKG48", gen: "CKG48 四期生", join: "2020-08-29" },
     { month: 8,  name: "黄歆源",   branchTeam: "CKG48", gen: "CKG48 四期生", join: "2020-08-29" },
     { month: 8,  name: "潘璐",     branchTeam: "CKG48", gen: "CKG48 四期生", join: "2020-08-29" },
     { month: 9,  name: "潘颖",     branchTeam: "CKG48", gen: "CKG48 四期生", join: "2020-09" },   // 用户口径 2026-XX 补挂建卡（2023 离团批次配套，月份精度）
     { month: 10, name: "吕曼菲",   branchTeam: "GNZ48", gen: "GNZ48 八期生", join: "2020-10-01" },
     { month: 10, name: "谢慧先",   branchTeam: "GNZ48", gen: "GNZ48 八期生", join: "2020-10-01" },
     { month: 10, name: "邓歆玥",   team: "PREP", gen: "十四期生", join: "2020-10-02" },
     { month: 10, name: "李星彦",   team: "PREP", gen: "十四期生", join: "2020-10-02" },
     { month: 10, name: "曲晨语",   team: "PREP", gen: "十四期生", join: "2020-10-02" },
     { month: 10, name: "闫娜",     team: "PREP", gen: "十四期生", join: "2020-10-02" },
     { month: 10, name: "卞楚娴",   team: "PREP", gen: "十四期生", join: "2020-10-03" },
     { month: 10, name: "冯雨停",   team: "PREP", gen: "十四期生", join: "2020-10-03" },
     { month: 10, name: "刘晨雪",   team: "PREP", gen: "十四期生", join: "2020-10-03" },
     { month: 10, name: "陆叶卉",   team: "PREP", gen: "十四期生", join: "2020-10-03" },
     { month: 11, name: "陈蓁蓁",   branchTeam: "BEJ48", gen: "BEJ48 九期生", join: "2020-11-22" },
     { month: 11, name: "范璐元",   branchTeam: "BEJ48", gen: "BEJ48 九期生", join: "2020-11-22" },
     { month: 11, name: "黄宣绮",   branchTeam: "BEJ48", gen: "BEJ48 九期生", join: "2020-11-22" },
     { month: 11, name: "黄怡慈",   branchTeam: "BEJ48", gen: "BEJ48 九期生", join: "2020-11-22" },
     { month: 11, name: "黄妍菲",   branchTeam: "BEJ48", gen: "BEJ48 九期生", join: "2020-11-22" },
     { month: 11, name: "胡雪迎",   branchTeam: "BEJ48", gen: "BEJ48 九期生", join: "2020-11-22" },
     { month: 11, name: "唐晨葳",   branchTeam: "BEJ48", gen: "BEJ48 九期生", join: "2020-11-22" },
     { month: 11, name: "张宸祎",   branchTeam: "BEJ48", gen: "BEJ48 九期生", join: "2020-11-22" },
     { month: 11, name: "赵嘉丽",   branchTeam: "BEJ48", gen: "BEJ48 九期生", join: "2020-11-22" },
     { month: 12, name: "姜欣瑶",   branchTeam: "GNZ48", gen: "GNZ48 九期生", join: "2020-12-31" },
     { month: 12, name: "江雨航",   branchTeam: "GNZ48", gen: "GNZ48 九期生", join: "2020-12-31" },
     { month: 12, name: "吕思琪",   branchTeam: "GNZ48", gen: "GNZ48 九期生", join: "2020-12-31" },
     { month: 12, name: "王琰",     branchTeam: "GNZ48", gen: "GNZ48 九期生", join: "2020-12-31" },
     { month: 12, name: "郑奕雯",   branchTeam: "GNZ48", gen: "GNZ48 九期生", join: "2020-12-31" },
   ],

  /* ---------------- 2021 年史实入团表（2021「春潮」线，引擎按月建卡） ----------------
     【按用户口径挂载（2026-XX 对话批次）】用户仅提供到月精度，join 字段按月份精度
     登记（宁缺毋滥，不虚构到日）。本部新期生挂 team:"PREP"（预备生）；分团新期生
     （GNZ48/CKG48/BEJ48）挂 branchTeam：引擎建分团预备生简卡（同 2018/2020 口径）。
     【不做分团开关校验】2021 线继承 2020 年末 SHY48/CKG48 旗号与 BEJ48 编号状态，
     2021 史实口径下 CKG48 五期 / BEJ48 十期 / GNZ48 十/十一期均照常入册。
     【名字备注】CKG48 五期 陈颖琳：用户口径括注亦写作「陈颍琳」，以陈颖琳为主名登记。
     【汇总】全年 33 条：影视部签约艺人路昕（1月，用户口径，到岗月份未提供按年初挂载）
     + 十五期生 6 人（4月）+ GNZ48 十期生 3 人（5月）+ 十六期生 5 人
     （9月）+ CKG48 五期生 7 人（11月）+ BEJ48 十期生 7 人、GNZ48 十一期生 4 人（12月）。 */
   joining2021: [
     { month: 4,  name: "林佳怡", team: "PREP", gen: "十五期生", join: "2021-04" },
     { month: 4,  name: "武博涵", team: "PREP", gen: "十五期生", join: "2021-04" },
     { month: 4,  name: "禹佳蔚", team: "PREP", gen: "十五期生", join: "2021-04" },
     { month: 4,  name: "张月铭", team: "PREP", gen: "十五期生", join: "2021-04" },
     { month: 4,  name: "张冉冉", team: "PREP", gen: "十五期生", join: "2021-04" },
     { month: 4,  name: "张诗芸", team: "PREP", gen: "十五期生", join: "2021-04" },
     { month: 5,  name: "陈泓宇", branchTeam: "GNZ48", gen: "GNZ48 十期生", join: "2021-05" },
     { month: 5,  name: "项宇婧", branchTeam: "GNZ48", gen: "GNZ48 十期生", join: "2021-05" },
     { month: 5,  name: "周培溪", branchTeam: "GNZ48", gen: "GNZ48 十期生", join: "2021-05" },
     { month: 9,  name: "王依柳", team: "PREP", gen: "十六期生", join: "2021-09" },
     { month: 9,  name: "熊紫轶", team: "PREP", gen: "十六期生", join: "2021-09" },
     { month: 9,  name: "贝楚涵", team: "PREP", gen: "十六期生", join: "2021-09" },
     { month: 9,  name: "芦馨怡", team: "PREP", gen: "十六期生", join: "2021-09" },
     { month: 9,  name: "朱涵佳", team: "PREP", gen: "十六期生", join: "2021-09" },
     { month: 11, name: "陈颖琳", branchTeam: "CKG48", gen: "CKG48 五期生", join: "2021-11", note: "亦作陈颍琳" },
     { month: 11, name: "付美善", branchTeam: "CKG48", gen: "CKG48 五期生", join: "2021-11" },
     { month: 11, name: "刘宇婷", branchTeam: "CKG48", gen: "CKG48 五期生", join: "2021-11" },
     { month: 11, name: "骆羽庭", branchTeam: "CKG48", gen: "CKG48 五期生", join: "2021-11" },
     { month: 11, name: "谢金男", branchTeam: "CKG48", gen: "CKG48 五期生", join: "2021-11" },
     { month: 11, name: "张帆",   branchTeam: "CKG48", gen: "CKG48 五期生", join: "2021-11" },
     { month: 11, name: "朱瑞缘", branchTeam: "CKG48", gen: "CKG48 五期生", join: "2021-11" },
     { month: 12, name: "郭晓盈", branchTeam: "BEJ48", gen: "BEJ48 十期生", join: "2021-12" },
     { month: 12, name: "韩雪",   branchTeam: "BEJ48", gen: "BEJ48 十期生", join: "2021-12" },
     { month: 12, name: "李思奥", branchTeam: "BEJ48", gen: "BEJ48 十期生", join: "2021-12" },
     { month: 12, name: "林滢",   branchTeam: "BEJ48", gen: "BEJ48 十期生", join: "2021-12" },
     { month: 12, name: "王思奕", branchTeam: "BEJ48", gen: "BEJ48 十期生", join: "2021-12" },
     { month: 12, name: "王言蹊", branchTeam: "BEJ48", gen: "BEJ48 十期生", join: "2021-12" },
     { month: 12, name: "朱虹蓉", branchTeam: "BEJ48", gen: "BEJ48 十期生", join: "2021-12" },
     { month: 12, name: "惠煜轩", branchTeam: "GNZ48", gen: "GNZ48 十一期生", join: "2021-12" },
     { month: 12, name: "黄汝彤", branchTeam: "GNZ48", gen: "GNZ48 十一期生", join: "2021-12" },
     { month: 12, name: "雷淑怡", branchTeam: "GNZ48", gen: "GNZ48 十一期生", join: "2021-12" },
     { month: 12, name: "林恩同", branchTeam: "GNZ48", gen: "GNZ48 十一期生", join: "2021-12" },
     /* 【影视部签约艺人（用户口径 2026-XX）】路昕 2021 年到岗；到岗月份未提供，
        按年初（1 月）口径挂载——待用户补充精确月份 */
     { month: 1, name: "路昕", team: "HALL", gen: "影视部签约艺人", hall: true, film: true, pop: 62, join: "2021-01", note: "影视部（非偶像体系出身；毕业于马来西亚思特雅大学）" },
   ],

  /* ---------------- 2022 年史实入团表（2022「元宇宙」线，引擎按月建卡） ----------------
     【按用户口径挂载（2026-XX 对话批次）】用户仅提供到月精度，join 字段按月份精度
     登记（宁缺毋滥，不虚构到日）。本部新期生挂 team:"PREP"（预备生）；分团新期生
     挂 branchTeam：引擎建分团预备生简卡（同 2018/2020/2021 口径）。
     【不做分团开关校验】同 2021 线口径：CKG48 五期跨年续批（2021-11 首批 7 人后，
     2022-01/05 续批）、BEJ48 十一期、GNZ48 十二/十三期均照常入册。
     【名字备注】刘小涵：2026 线数据（data_members_2026.js）登记 join 2022-08-27，
     本表按用户口径只到月，维持月份精度。
     【汇总】全年 32 条：影视部签约艺人唐本（1月，用户口径，到岗月份未提供按年初挂载）
     + CKG48 五期生 1 人（1月）+ CKG48 五期生 1 人、GNZ48 十二期生
     2 人（5月）+ BEJ48 十一期生 2 人（6月）+ 本部十七期生 3 人（8月）+ GNZ48 十三期生
     20 人、本部十七期生 2 人（10月）。 */
   joining2022: [
     { month: 1,  name: "罗恩妮", branchTeam: "CKG48", gen: "CKG48 五期生",   join: "2022-01" },
     { month: 5,  name: "彭含灵", branchTeam: "CKG48", gen: "CKG48 五期生",   join: "2022-05" },
     { month: 5,  name: "侯祎冉", branchTeam: "GNZ48", gen: "GNZ48 十二期生", join: "2022-05" },
     { month: 5,  name: "陆靖婷", branchTeam: "GNZ48", gen: "GNZ48 十二期生", join: "2022-05" },
     { month: 6,  name: "吴睿莎", branchTeam: "BEJ48", gen: "BEJ48 十一期生", join: "2022-06" },
     { month: 6,  name: "朱力维", branchTeam: "BEJ48", gen: "BEJ48 十一期生", join: "2022-06" },
     { month: 8,  name: "刘小涵", team: "PREP", gen: "十七期生", join: "2022-08" },
     { month: 8,  name: "吕相宜", team: "PREP", gen: "十七期生", join: "2022-08" },
     { month: 8,  name: "张文婷", team: "PREP", gen: "十七期生", join: "2022-08" },
     { month: 10, name: "陈淑钰", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "郭兆媛", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "何林燕", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "黄艺暄", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "林奕希", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "刘欣媛", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "马可悦", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "蒙晓丽", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "秦露丹", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "邱刘佳", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "申雨鑫", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "宋筱璐", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "谭思慧", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "王语晨", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "夏莹",   branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "许雅兰", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "叶溁语", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "钟洁玟", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "周是汝", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "张芷欣", branchTeam: "GNZ48", gen: "GNZ48 十三期生", join: "2022-10" },
     { month: 10, name: "施未希", team: "PREP", gen: "十七期生", join: "2022-10" },
     { month: 10, name: "占迪",   team: "PREP", gen: "十七期生", join: "2022-10" },
     /* 【影视部签约艺人（用户口径 2026-XX）】唐本 2022 年到岗；到岗月份未提供，
        按年初（1 月）口径挂载——待用户补充精确月份 */
     { month: 1, name: "唐本", team: "HALL", gen: "影视部签约艺人", hall: true, film: true, pop: 70, join: "2022-01", note: "影视部（非偶像体系出身；毕业于北京电影学院）" },
   ],

  /* ---------------- 2022 年史实离团表（2022「元宇宙」线，引擎按月触发） ----------------
     【按用户口径挂载（2026-XX 对话批次，月份精度）】两类：
     ①成员精简（同 2021 线 layoff21 机制）：note 含「成员精简」的条目不走通用离团，
       engine monthStart 登记到 layoff21Names，按卡况动态分配——未兼任分团成员自动
       支付补偿（15 万/人），本部/玩家兼任分团成员进 layoff21Choice 由玩家拍板。
       本年 4 人均为分团卡（BEJ 十期/CKG 五期），玩家未兼任对应分团时自动支付。
     ②通用离团：type="离团" 直接落地（left）。
     【补挂建卡（用户口径 2026-XX 对话批次）】原查无卡 5 人已按口径补挂：
     王炯义（GNZ48一期生 2016-10 入，branchRoster2017 卡名从「烱」改「炯」）、
     赖俊亦/谢艾琳（GNZ48二期生 2017-04-29 入，joining2017 补挂）、
     梁婉琳（GNZ48三期生 2017-10-01 入，joining2017 补挂）、
     张爱静（SHY48一期生 2016-10 入，随 SHY48 开业建卡）——离团正常落地。
     【跳过说明】周倩玉（2016 剧情线解约/留籍察看双口径）若已离团自动跳过；
     江鑫/潘璐瑶（2019 主线③招新拍板池）未招入则无卡自动跳过。 */
   leaving2022: [
     /* —— 成员精简（同 2021 线裁撤设计，动态分配 + 补偿拍板） —— */
     { month: 6,  name: "林滢",   date: "2022-06", type: "离团", story: false, note: "成员精简（BEJ48十期生）" },
     { month: 7,  name: "罗恩妮", date: "2022-07", type: "离团", story: false, note: "成员精简（CKG48五期生）" },
     { month: 7,  name: "刘宇婷", date: "2022-07", type: "离团", story: false, note: "成员精简（CKG48五期生）" },
     { month: 8,  name: "王言蹊", date: "2022-08", type: "离团", story: false, note: "成员精简（BEJ48十期生）" },
     /* —— 通用离团 —— */
     { month: 1,  name: "王炯义", date: "2022-01", type: "离团", story: false, note: "通用离团（GNZ48一期生）" },
     { month: 1,  name: "吕曼菲", date: "2022-01", type: "离团", story: false, note: "通用离团（GNZ48八期生）" },
     { month: 1,  name: "范璐元", date: "2022-01", type: "离团", story: false, note: "通用离团（BEJ48九期生）" },
     { month: 2,  name: "潘璐瑶", date: "2022-02", type: "离团", story: false, note: "通用离团（十二期生）" },
     { month: 3,  name: "陈妮亚", date: "2022-03", type: "离团", story: false, note: "通用离团（CKG48四期生）" },
     { month: 3,  name: "曹露丹", date: "2022-03", type: "离团", story: false, note: "通用离团（CKG48三期生）" },
     { month: 3,  name: "刘果",   date: "2022-03", type: "离团", story: false, note: "通用离团（GNZ48七期生）" },
     { month: 3,  name: "赖俊亦", date: "2022-03", type: "离团", story: false, note: "通用离团（GNZ48二期生）" },
     { month: 4,  name: "谢艾琳", date: "2022-04", type: "离团", story: false, note: "通用离团（GNZ48二期生）" },
     { month: 6,  name: "江鑫",   date: "2022-06", type: "离团", story: false, note: "通用离团（十二期生）" },
     { month: 6,  name: "周倩玉", date: "2022-06", type: "离团", story: false, note: "通用离团（六期生·GNZ48）" },
     { month: 6,  name: "毛译晗", date: "2022-06", type: "离团", story: false, note: "通用离团（CKG48一期生）" },
     { month: 7,  name: "阳青颖", date: "2022-07", type: "离团", story: false, note: "通用离团（五期生·GNZ48）" },
     { month: 8,  name: "吴晶晶", date: "2022-08", type: "离团", story: false, note: "通用离团（CKG48一期生）" },
     { month: 8,  name: "张诗芸", date: "2022-08", type: "离团", story: false, note: "通用离团（十五期生）" },
     { month: 8,  name: "杨允涵", date: "2022-08", type: "离团", story: false, note: "通用离团（SHY48一期生）" },
     { month: 8,  name: "梁婉琳", date: "2022-08", type: "离团", story: false, note: "通用离团（GNZ48三期生）" },
     { month: 9,  name: "张雨鑫", date: "2022-09", type: "离团", story: false, note: "通用离团（三期生）" },
     { month: 10, name: "陈倩楠", date: "2022-10", type: "离团", story: false, note: "通用离团（六期生·BEJ48）" },
     { month: 10, name: "张爱静", date: "2022-10", type: "离团", story: false, note: "通用离团（SHY48一期生）" },
   ],

  /* ---------------- 2023 年内新加入（2023「交棒」线用） ----------------
     【按用户口径挂载（2026-XX 对话批次，精确到日）】join 字段按用户提供的日期登记。
     本部新期生挂 team:"PREP"（预备生）；分团新期生挂 branchTeam：引擎建分团预备生
     简卡（同 2018/2020/2021/2022 口径，初始人气按分团梯度 branchJoinPop 低于同期本部）。
     【CGT48 批次特殊处理（用户口径）】CGT48 一/二期生（6月 16 人 + 12月 5 人）不在
     monthStart ① 常规落地：CGT48 成立后入册——flags.cgt23Open（成都丝芭开幕）后按
     批次月序追补建 CGT48 分团预备生简卡；全年未成立（1 月拍板 later 或三段未完成）
     → 12 月末全部转入 GNZ48 建卡，note「CGT48委培（CGT48成立后移籍入册）」；2024 年
     CGT48 成立后移籍入册（2024 线待建，按 note 识别回收）。统一由 engine.mountCgt23Join
     在 monthStart ① 末（建卡后、离团表处理前）/fastSim 落地（幂等去重）。
     【不做分团开关校验】同 2021/2022 线口径：BEJ48 十二/十三期、GNZ48 十四/十五/十六期、
     CKG48 六/七期均照常入册。
     【重名核查】本表 86 人与既有名册（data_members.js 本部+2016~2022 入团表）查无重名，
     本部条目「同名即拦」去重不会误拦。
     【汇总】全年 86 人：BEJ48 十二期生 7 人（1/3/5 月）+ SNH48 十八期生 8 人（5 月）+
     GNZ48 十四期生 3 人（5 月）+ CKG48 六期生 15 人（6 月）+ CGT48 一期生 16 人（6 月，特殊处理）+
     BEJ48 十三期生 11 人（9/12 月）+ SNH48 十九期生 7 人（9/11 月）+ CKG48 七期生 7 人
     （9/10 月）+ GNZ48 十五期生 5 人（10 月）+ CGT48 二期生 5 人（12 月，特殊处理）+
     GNZ48 十六期生 2 人（12 月）。 */
  joining2023: [
    /* —— 1月：BEJ48 十二期生（2023-01-02，2 人） —— */
    { month: 1,  name: "马欣宇", branchTeam: "BEJ48", gen: "BEJ48 十二期生", join: "2023-01-02" },
    { month: 1,  name: "郑照暄", branchTeam: "BEJ48", gen: "BEJ48 十二期生", join: "2023-01-02" },
    /* —— 3月：BEJ48 十二期生（2023-03-11，3 人） —— */
    { month: 3,  name: "高梓萌", branchTeam: "BEJ48", gen: "BEJ48 十二期生", join: "2023-03-11" },
    { month: 3,  name: "聂渝景", branchTeam: "BEJ48", gen: "BEJ48 十二期生", join: "2023-03-11" },
    { month: 3,  name: "庄雅雯", branchTeam: "BEJ48", gen: "BEJ48 十二期生", join: "2023-03-11" },
    /* —— 5月：BEJ48 十二期生（2023-05-02，2 人）+ SNH48 十八期生（2023-05-02，8 人）
            + GNZ48 十四期生（2023-05-07，3 人） —— */
    { month: 5,  name: "李歆乐",   branchTeam: "BEJ48", gen: "BEJ48 十二期生", join: "2023-05-02" },
    { month: 5,  name: "朱一柠",   branchTeam: "BEJ48", gen: "BEJ48 十二期生", join: "2023-05-02" },
    { month: 5,  name: "李虞龙若", team: "PREP", gen: "十八期生", join: "2023-05-02" },
    { month: 5,  name: "卢晨昕",   team: "PREP", gen: "十八期生", join: "2023-05-02" },
    { month: 5,  name: "温若其",   team: "PREP", gen: "十八期生", join: "2023-05-02" },
    { month: 5,  name: "许佳佳",   team: "PREP", gen: "十八期生", join: "2023-05-02" },
    { month: 5,  name: "杨心渝",   team: "PREP", gen: "十八期生", join: "2023-05-02" },
    { month: 5,  name: "尤可莹",   team: "PREP", gen: "十八期生", join: "2023-05-02" },
    { month: 5,  name: "张怡婷",   team: "PREP", gen: "十八期生", join: "2023-05-02" },
    { month: 5,  name: "周童玥",   team: "PREP", gen: "十八期生", join: "2023-05-02" },
    { month: 5,  name: "陈珊玲", branchTeam: "GNZ48", gen: "GNZ48 十四期生", join: "2023-05-07" },
    { month: 5,  name: "陶慧",   branchTeam: "GNZ48", gen: "GNZ48 十四期生", join: "2023-05-07" },
    { month: 5,  name: "荣子彤", branchTeam: "GNZ48", gen: "GNZ48 十四期生", join: "2023-05-07" },
    /* —— 6月：CKG48 六期生（2023-06-02，15 人）+ CGT48 一期生（2023-06-02，16 人，特殊处理） —— */
    { month: 6,  name: "陈韵佳", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "何馨曼", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "胡丹",   branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "姬梦真", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "刘星雨", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "卢美廷", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "马星月", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "彭夕株", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "吴志越", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "杨添淩", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "张莉莉", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "张思妍", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "张伟依", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "张咏烨", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    { month: 6,  name: "张钰叶", branchTeam: "CKG48", gen: "CKG48 六期生", join: "2023-06-02" },
    /* CGT48 一期生：CGT48 成立后入册；未成立则年末入 GNZ48 委培（见表头注释） */
    { month: 6,  name: "程妤涵", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "何蔡娴", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "何梦迪", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "何渝欣", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "雷相菊", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "雷薪梦", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "林海盈", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "齐灵泉", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "任烨彦", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "谭勇航", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "王依",   branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "王艺霖", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "徐钰涵", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "袁艺洁", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "吴云",   branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    { month: 6,  name: "程宝玉", branchTeam: "CGT48", gen: "CGT48 一期生", join: "2023-06-02" },
    /* —— 9月：BEJ48 十三期生（2023-09-17，10 人）+ SNH48 十九期生（2023-09-30，6 人）
            + CKG48 七期生（2023-09-30，3 人） —— */
    { month: 9,  name: "阿丽米热", branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "陈枳霏",   branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "刁昕妤",   branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "高予瑾",   branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "孟清渝",   branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "沈祉含",   branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "孙嘉馥",   branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "王祉依",   branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "袁涵",     branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "张歆如",   branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-09-17" },
    { month: 9,  name: "梁怀方", team: "PREP", gen: "十九期生", join: "2023-09-30" },
    { month: 9,  name: "唐程成", team: "PREP", gen: "十九期生", join: "2023-09-30" },
    { month: 9,  name: "王悦垚", team: "PREP", gen: "十九期生", join: "2023-09-30" },
    { month: 9,  name: "王紫澍", team: "PREP", gen: "十九期生", join: "2023-09-30" },
    { month: 9,  name: "叶凡",   team: "PREP", gen: "十九期生", join: "2023-09-30" },
    { month: 9,  name: "张倩",   team: "PREP", gen: "十九期生", join: "2023-09-30" },
    { month: 9,  name: "石梦湲", branchTeam: "CKG48", gen: "CKG48 七期生", join: "2023-09-30" },
    { month: 9,  name: "谭景文", branchTeam: "CKG48", gen: "CKG48 七期生", join: "2023-09-30" },
    { month: 9,  name: "王思予", branchTeam: "CKG48", gen: "CKG48 七期生", join: "2023-09-30" },
    /* —— 10月：GNZ48 十五期生（2023-10-06，5 人）+ CKG48 七期生（2023-10-29，4 人） —— */
    { month: 10, name: "丁嘉欣", branchTeam: "GNZ48", gen: "GNZ48 十五期生", join: "2023-10-06" },
    { month: 10, name: "林家谊", branchTeam: "GNZ48", gen: "GNZ48 十五期生", join: "2023-10-06" },
    { month: 10, name: "孙毓园", branchTeam: "GNZ48", gen: "GNZ48 十五期生", join: "2023-10-06" },
    { month: 10, name: "王珺",   branchTeam: "GNZ48", gen: "GNZ48 十五期生", join: "2023-10-06" },
    { month: 10, name: "谢晓倩", branchTeam: "GNZ48", gen: "GNZ48 十五期生", join: "2023-10-06" },
    { month: 10, name: "陈萧扬", branchTeam: "CKG48", gen: "CKG48 七期生", join: "2023-10-29" },
    { month: 10, name: "胡思颖", branchTeam: "CKG48", gen: "CKG48 七期生", join: "2023-10-29" },
    { month: 10, name: "林丹蕾", branchTeam: "CKG48", gen: "CKG48 七期生", join: "2023-10-29" },
    { month: 10, name: "申家璐", branchTeam: "CKG48", gen: "CKG48 七期生", join: "2023-10-29" },
    /* —— 11月：SNH48 十九期生（2023-11-01，1 人） —— */
    { month: 11, name: "张瀚引", team: "PREP", gen: "十九期生", join: "2023-11-01" },
    /* —— 12月：CGT48 二期生（2023-12-15，5 人，特殊处理）+ GNZ48 十六期生
            （2023-12-15，2 人）+ BEJ48 十三期生（2023-12-16，1 人） —— */
    { month: 12, name: "兰雅心", branchTeam: "CGT48", gen: "CGT48 二期生", join: "2023-12-15" },
    { month: 12, name: "梅思华", branchTeam: "CGT48", gen: "CGT48 二期生", join: "2023-12-15" },
    { month: 12, name: "徐钰清", branchTeam: "CGT48", gen: "CGT48 二期生", join: "2023-12-15" },
    { month: 12, name: "张羽多", branchTeam: "CGT48", gen: "CGT48 二期生", join: "2023-12-15" },
    { month: 12, name: "张咏琪", branchTeam: "CGT48", gen: "CGT48 二期生", join: "2023-12-15" },
    { month: 12, name: "焦玥",   branchTeam: "GNZ48", gen: "GNZ48 十六期生", join: "2023-12-15" },
    { month: 12, name: "李咏薇", branchTeam: "GNZ48", gen: "GNZ48 十六期生", join: "2023-12-15" },
    { month: 12, name: "丁子钦", branchTeam: "BEJ48", gen: "BEJ48 十三期生", join: "2023-12-16" },
  ],

  /* ---------------- 2023 年内离团（2023「交棒」线用） ----------------
     【用户口径】2023 人员变动待用户口径，当前空表占位（宁缺册滥）。
     口径到位后挂载：通用离团 type="离团" 直接落地；成员精简 note 含「成员精简」
     走 layoff21 补偿拍板机制（复用 2021/2022 口径）。 */
  /* ---------------- 2023 年内离团（2023「交棒」线用） ----------------
     【按用户口径挂载（2026-XX 对话批次，月份精度）】两类：
     ①通用离团：type="离团" 直接落地（left）。
     ②名单精简（用户口径用词；同 2021/2022 线 layoff21 机制）：note 含「成员精简」的条目
       不走通用离团，engine monthStart 登记到 layoff21Names，按卡况动态分配——未兼任分团
       成员自动支付补偿（15 万/人），本部/玩家兼任分团成员进 layoff21Choice 由玩家拍板
       （行动区「名单精简补偿拍板」→ UI layoff21Pick，复用既有拍板窗）。
       名单精简 12 人：本部 PREP 4 人（张文婷/施未希/占迪/李虞龙若）走拍板，
       分团卡 7 人按兼任情况自动/拍板；何渝欣为 CGT48 一期生双路径卡——成立线按 CGT48 卡
       命中（未兼任 CGT48 自动补偿），未成立线未入册自然跳过（见 mountCgt23Join）。
     【SHY48 条目不带 branchTeam】王菲妍/高崇/王秋茹若 2017 未点亮沈阳剧场则未建卡、
       或 2019 组阁 IDFT 化后 branchTeam 已清，不带 branchTeam 按姓名命中避免永不命中。
     【原查无卡 8 人已按用户口径落实（2026-XX 对话批次）】
       · 潘颖（CKG48 四期生 2020-09）/高蔚然、付奕萱（BEJ48 四期生 2018-04）/
         谢菲菲（GNZ48 五期生 2018-04）——joining2020/2018 补挂建卡（月份精度）；
       · 吴学雨、冉蔚（CKG48 一期生 2017-10）——已在 CKG48 开业名册
         （branchFoundingRoster.CKG48），随开业建卡，无需补挂；
       · 王若诗蓝=王丹妮（BEJ48 八期生，joining2020 既有卡，note 曾用名）——
         离团按卡册名王丹妮命中；
       · 陈颒琳=陈颖琳（CKG48 五期生，joining2021 既有卡，note 亦作陈颒琳）——
         离团按卡册名陈颖琳命中；
       · 吴学雨/冉蔚不带 branchTeam：2019 组阁后 CKG 一期生可能 IDFT 化（branchTeam
         清空）或保旗在册，按姓名命中兼容两口径；已随 2019 下放离团者自然跳过。
     【汇总】已挂载 36 人：通用离团 24 人 + 名单精简 12 人。 */
  leaving2023: [
     /* —— 名单精简（同 2021/2022 线裁撤设计，动态分配 + 补偿拍板） —— */
     { month: 3,  name: "张文婷",   date: "2023-03", type: "离团", story: false, note: "成员精简（本部十七期生）" },
     { month: 3,  name: "施未希",   date: "2023-03", type: "离团", story: false, note: "成员精简（本部十七期生）" },
     { month: 3,  name: "占迪",     date: "2023-03", type: "离团", story: false, note: "成员精简（本部十七期生）" },
     { month: 4,  name: "韩雪",     date: "2023-04", type: "离团", story: false, note: "成员精简（BEJ48 十期生）", branchTeam: "BEJ48" },
     { month: 6,  name: "彭含灵",   date: "2023-06", type: "离团", story: false, note: "成员精简（CKG48 五期生）", branchTeam: "CKG48" },
     { month: 6,  name: "谢金男",   date: "2023-06", type: "离团", story: false, note: "成员精简（CKG48 五期生）", branchTeam: "CKG48" },
     { month: 7,  name: "黄艺暄",   date: "2023-07", type: "离团", story: false, note: "成员精简（GNZ48 十三期生）", branchTeam: "GNZ48" },
     { month: 8,  name: "陶慧",     date: "2023-08", type: "离团", story: false, note: "成员精简（GNZ48 十四期生·本年5月卡）", branchTeam: "GNZ48" },
     { month: 9,  name: "高梓萌",   date: "2023-09", type: "离团", story: false, note: "成员精简（BEJ48 十二期生·本年3月卡）", branchTeam: "BEJ48" },
     { month: 9,  name: "李虞龙若", date: "2023-09", type: "离团", story: false, note: "成员精简（本部十八期生·本年5月卡）" },
     { month: 9,  name: "荣子彤",   date: "2023-09", type: "离团", story: false, note: "成员精简（GNZ48 十四期生·本年5月卡）", branchTeam: "GNZ48" },
     { month: 11, name: "何渝欣",   date: "2023-11", type: "离团", story: false, note: "成员精简（CGT48 一期生·本年6月卡；成立线按卡命中，未成立线未入册自然跳过）" },
     /* —— 通用离团 —— */
     { month: 1,  name: "任蔓琳", date: "2023-01", type: "离团", story: false, note: "通用离团（BEJ48五期生）", branchTeam: "BEJ48" },
     { month: 1,  name: "周培溪", date: "2023-01", type: "离团", story: false, note: "通用离团（GNZ48 十期生）", branchTeam: "GNZ48" },
     { month: 1,  name: "雷淑怡", date: "2023-01", type: "离团", story: false, note: "通用离团（GNZ48 十一期生）", branchTeam: "GNZ48" },
     { month: 1,  name: "潘颖",   date: "2023-01", type: "离团", story: false, note: "通用离团（CKG48 四期生）", branchTeam: "CKG48" },
     { month: 1,  name: "吴学雨", date: "2023-01", type: "离团", story: false, note: "通用离团（CKG48 一期生；不带 branchTeam，见装头注释）" },
     { month: 2,  name: "唐晨葳", date: "2023-02", type: "离团", story: false, note: "通用离团（BEJ48 九期生）", branchTeam: "BEJ48" },
     { month: 3,  name: "高蔚然", date: "2023-03", type: "离团", story: false, note: "通用离团（BEJ48 四期生）", branchTeam: "BEJ48" },
     { month: 3,  name: "贝楚涵", date: "2023-03", type: "离团", story: false, note: "通用离团（十六期生·本部预备生）" },
     { month: 3,  name: "王秋茹", date: "2023-03", type: "离团", story: false, note: "通用离团（SHY48四期生）" },
     { month: 4,  name: "王菲妍", date: "2023-04", type: "离团", story: false, note: "通用离团（SHY48二期生）" },
     { month: 4,  name: "王丹妮", date: "2023-04", type: "离团", story: false, note: "通用离团（BEJ48 八期生；报名名王若诗蓝，按卡册名命中）", branchTeam: "BEJ48" },
     { month: 5,  name: "王偲越", date: "2023-05", type: "离团", story: false, note: "通用离团（GNZ48一期生）", branchTeam: "GNZ48" },
     { month: 5,  name: "陈桂君", date: "2023-05", type: "离团", story: false, note: "通用离团（GNZ48一期生）", branchTeam: "GNZ48" },
     { month: 5,  name: "谢菲菲", date: "2023-05", type: "离团", story: false, note: "通用离团（GNZ48 五期生）", branchTeam: "GNZ48" },
     { month: 6,  name: "刘胜男", date: "2023-06", type: "离团", story: false, note: "通用离团（六期生·BEJ48 Team E）", branchTeam: "BEJ48" },
     { month: 6,  name: "吕一",   date: "2023-06", type: "离团", story: false, note: "通用离团（七期生·本部）" },
     { month: 8,  name: "惠煜轩", date: "2023-08", type: "离团", story: false, note: "通用离团（GNZ48 十一期生）", branchTeam: "GNZ48" },
     { month: 8,  name: "冉蔚",   date: "2023-08", type: "离团", story: false, note: "通用离团（CKG48 一期生；不带 branchTeam，见装头注释）" },
     { month: 8,  name: "高崇",   date: "2023-08", type: "离团", story: false, note: "通用离团（SHY48二期生）" },
     { month: 8,  name: "李思奥", date: "2023-08", type: "离团", story: false, note: "通用离团（BEJ48 十期生）", branchTeam: "BEJ48" },
     { month: 9,  name: "张帆",   date: "2023-09", type: "离团", story: false, note: "通用离团（CKG48 五期生）", branchTeam: "CKG48" },
     { month: 9,  name: "陈颖琳", date: "2023-09", type: "离团", story: false, note: "通用离团（CKG48 五期生；用户口径陈颒琳，按卡册名陈颖琳命中）", branchTeam: "CKG48" },
     { month: 10, name: "张茜",   date: "2023-10", type: "离团", story: false, note: "通用离团（九期生·本部预备生）" },
     { month: 12, name: "付奕萱", date: "2023-12", type: "离团", story: false, note: "通用离团（BEJ48 四期生）", branchTeam: "BEJ48" },
   ],

  /* ---------------- 2019 年史实节点（新线锚点） ---------------- */
  history2019: {
    reorgDate: "2019-01-19",        // 第二次全团大组阁（Team XII 解散；IDFT 同日成立的史实节点）
    idftFounded: "2019-01-19",      // IDFT（IDOLS FT）训练生池成立——SHY/CKG 成员移籍地
    electionDate: "2019-07-27",     // 第六届总决选（李艺彤蝉联第一）
    electionTop5: ["李艺彤", "黄婷婷", "段艺璇", "冯薪朵", "莫寒"],  // 史实前五（剧情对照）
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

  /* 金曲大赏 TOP10 挂载表（2016~2021 全线；2016~2019 来源：用户提供的史实榜单截图）。
     规则：
     · 2016 完全照表挂载（所有名次锁史实名单）；
     · 2017/2018 只前三按史实挂载，4~10 歌名按史实、参演成员按人气生成
       （同一成员至多参加两曲，已满顺延；史实为队伍参演的名次选磨合度最高的队伍，
       队伍全榜只能出现一次）；
     · 2019 公布模式不同：公布前8+队歌第一——年度金曲《就差一点点》即为第一，
       往上排名顺延（耀阳组），最下为年度荣耀队歌第一（按史实 BEJ48 Team B）。
     · 2021 按用户口径挂载（2026-XX 提供；2026-XX 修正：原误标为 2020 年的榜单实为
       2021 年度金曲，已移桂至 2021）：荣耀队歌《honor》Team HII；前三锁史实名单；
       4~10 名仅歌名与人数口径，参演成员按人气生成（原名单未提供具体姓名，待用户
       补充后可改 fixed 挂载）。
     · 2020 按用户口径挂载（2026-XX 补挂批次）：荣耀队歌《花之祭》SNH48 Team NII；
       前三锁史实名单；4~10 名仅歌名与人数口径，参演成员按人气生成（原名单未提供
       具体姓名，待用户补充后可改 fixed 挂载）；线下停办，12月线上直播收费，
       收益减半（引擎 resolveRT 口径）。
     · 2023 按用户口径挂载（2026-XX 批次）：荣耀队歌《远方的海》SNH48 Team NII；
       前三锁史实名单（《失忆（UNAWARE）》周诗雨、王奕 / 《辛德瑞拉（CINDERELLA）》
       王晓佳 / 《HATE 2 LOVE（曼陀罗）》陈珂、郑丹妮）；4~10 名仅歌名与人数口径
       （4~7 名各 2 人、8~9 名各 7 人、10 名 2 人），参演成员按人气生成。
       本年起规则更新（用户口径）：当年离团成员可参加当年金曲大赏（不参加下一年
       金曲）——引擎以 carryTo 上年末快照 roster<era-1> 在籍为基准判定，
       详见 resolveGoldSongs。
     字段：fixed=锁史实名单；names=参演成员（史实）；team/teamKey=史实为队伍参演；
     gen=生成名次的参演人数（数字）或 "team"（队伍参演）。 */
  goldSongs: {
    "2016": {
      list: [
        { rank: 10, song: "燃烧的道路", from: "Team NII 3rd Stage「前所未有」公演", fixed: true, names: ["黄婷婷", "赵粤"] },
        { rank: 9,  song: "爱恨的泪",   from: "Team SII 3rd Stage「不眠之夜」公演", fixed: true, names: ["冯薪朵", "陆婷"] },
        { rank: 8,  song: "爱的加速器", from: "Team NII 3rd Stage「前所未有」公演", fixed: true, names: ["鞠婧祎"] },
        { rank: 7,  song: "心型病毒",   from: "Team SII 2nd Stage「永恒之光」公演", fixed: true, names: ["杨冰怡", "杨韫玉", "张丹三"] },
        { rank: 6,  song: "再见，制服", from: "Team SII 4th Stage「勇气重生」公演", fixed: true, names: ["戴萌", "莫寒", "张语格"] },
        { rank: 5,  song: "如果你拥抱我", from: "Team NII 2nd Stage「逆流而上」公演", fixed: true, names: ["戴萌", "邱欣怡", "黄婷婷"] },
        { rank: 4,  song: "雨中钢琴师", from: "Team HII 2nd Stage「手牵手」公演", fixed: true, names: ["徐子轩", "李艺彤", "刘佩鑫"] },
        { rank: 3,  song: "恋爱捉迷藏", from: "Team NII 1st Stage「剧场女神」公演", fixed: true, names: ["唐安琪"] },
        { rank: 2,  song: "Bingo!",     from: "Team NII 4th Stage「我的太阳」公演", fixed: true, team: "SNH48 Team NII", teamKey: "NII" },
        { rank: 1,  song: "夜蝶",       from: "Team SII/Team X 1st Stage「最后的钟声响起」公演", fixed: true, names: ["李艺彤", "黄婷婷"] },
      ],
    },
    "2017": {
      list: [
        { rank: 10, song: "爱到累了",     from: "Team NII 4th Stage「我的太阳」公演", gen: 3 },
        { rank: 9,  song: "狼与自尊",     from: "SNH48 EP《雨季之后》", gen: 2 },
        { rank: 8,  song: "巧克力糖果",   from: "Team SII 5th Stage「让梦想闪耀」公演", gen: 3 },
        { rank: 7,  song: "错过奇迹",     from: "Team SII 4th Stage「勇气重生」公演", gen: 3 },
        { rank: 6,  song: "第一只兔子",   from: "SNH48 EP《鸣吒》", gen: "team" },
        { rank: 5,  song: "青春闪电",     from: "Team SII 5th Stage「让梦想闪耀」公演", gen: 1 },
        { rank: 4,  song: "木偶",         from: "Team NII 6th Stage「专属派对」公演", gen: 1 },
        { rank: 3,  song: "我的舞台",     from: "Team SII 7th Stage「心的旅程」公演", fixed: true, team: "SNH48 Team SII", teamKey: "SII" },
        { rank: 2,  song: "爱恨的泪",     from: "Team SII 3rd Stage「不眠之夜」公演", fixed: true, names: ["李艺彤", "黄婷婷"] },
        { rank: 1,  song: "Don't touch", from: "Team NII 6th Stage「专属派对」公演", fixed: true, names: ["鞠婧祎", "曾艳芬", "赵粤"] },
      ],
    },
    "2018": {
      list: [
        { rank: 10, song: "不曾后悔",           from: "出自公演《让梦想闪耀》", gen: 4 },
        { rank: 9,  song: "再爱一回",           from: "出自公演《最后的钟声响起》", gen: 4 },
        { rank: 8,  song: "Monster（SOLO）",    from: "出自公演《梦想的旗帜》", gen: 1 },
        { rank: 7,  song: "9 To 9",             from: "出自公演《双面偶像》", gen: 2 },
        { rank: 6,  song: "潜梦",               from: "出自公演《以爱之名》", gen: 3 },
        { rank: 5,  song: "未接来电",           from: "出自公演《以爱之名》", gen: 2 },
        { rank: 4,  song: "人间规则（SOLO）",   from: "出自公演《代号XII 2.0超感进化版》", gen: 1 },
        { rank: 3,  song: "青涩的香蕉",         from: "出自公演《让梦想闪耀》", fixed: true, names: ["陈珂", "郑丹妮"] },
        { rank: 2,  song: "光之轨迹（16人）",   from: "出自公演《以爱之名》", fixed: true, team: "SNH48 Team NII", teamKey: "NII" },
        { rank: 1,  song: "春夏秋冬（UNIT）",   from: "出自公演《以爱之名》", fixed: true, names: ["苏杉杉", "王诗蒙", "冯思佳", "张丹三"] },
      ],
    },
    "2019": {
      list: [
        { rank: 8, song: "深海之声",             from: "出自公演《命运的X号》", gen: 3 },
        { rank: 7, song: "巧克力之吻",           from: "出自公演《偶像的黎明》", gen: 3 },
        { rank: 6, song: "人间规则（Unit）",     from: "出自公演《代号XII 2.0超感进化版》", gen: 3 },
        { rank: 5, song: "9 to 9",               from: "出自公演《双面偶像》", gen: 2 },
        { rank: 4, song: "钢铁之舞（Solo）",     from: "出自公演《命运的X号》", gen: 1 },
        { rank: 3, song: "Zen",                 from: "出自公演《三角函数》", gen: "team" },
        { rank: 2, song: "Spy",                 from: "出自公演《B A FIGHTER》", gen: 2 },
        { rank: 1, song: "就差一点点",           from: "出自公演《三角函数》", fixed: true, names: ["戴萌", "莫寒"], tag: "年度金曲" },
        { rank: 9, song: "笨",                   from: "出自公演《B A FIGHTER》", fixed: true, team: "BEJ48 Team B", teamKey: "BEJ48", tag: "年度荣耀队歌", last: true },
      ],
    },
    "2020": {   // 按用户口径补挂（2026-XX 批次；线上大赏，12月直播收费收益减半）
      list: [
        { rank: 10, song: "玛利亚",           from: "", gen: 2 },
        { rank: 9,  song: "低烧",             from: "", gen: 2 },
        { rank: 8,  song: "不安星",           from: "", gen: 2 },
        { rank: 7,  song: "最终回合",         from: "", gen: 4 },
        { rank: 6,  song: "临兵斗者皆阵列在前", from: "", gen: 3 },
        { rank: 5,  song: "夕阳下的约定",     from: "", gen: 6 },
        { rank: 4,  song: "Gravity",          from: "", gen: 1 },
        { rank: 3,  song: "美杜莎的温柔",     from: "", fixed: true, names: ["吴哲晗", "许佳琪"] },
        { rank: 2,  song: "who i am",         from: "", fixed: true, names: ["戴萌", "莫寒"] },
        { rank: 1,  song: "Hold Me Tight",    from: "", fixed: true, names: ["陆婷", "冯薪朵"], tag: "年度金曲" },
        { rank: 11, song: "花之祭",           from: "", fixed: true, team: "SNH48 Team NII", teamKey: "NII", tag: "年度荣耀队歌", last: true },
      ],
    },
    "2021": {   // 按用户口径修正：本榜单实为 2021 年度金曲（原误标 2020）
      list: [
        { rank: 10, song: "feeling you",  from: "", gen: 1 },
        { rank: 9,  song: "重生计划",     from: "", gen: "team" },
        { rank: 8,  song: "无声的探戈",   from: "", gen: 2 },
        { rank: 7,  song: "like i do",    from: "", gen: 1 },
        { rank: 6,  song: "恋爱告急",     from: "", gen: 1 },
        { rank: 5,  song: "my boy",       from: "", gen: 2 },
        { rank: 4,  song: "hold me tight", from: "", gen: 2 },
        { rank: 3,  song: "低烧",         from: "", fixed: true, names: ["陈倩楠", "苏杉杉"] },
        { rank: 2,  song: "就差一点点",   from: "", fixed: true, names: ["谢蕾蕾", "张琼予"] },
        { rank: 1,  song: "爱未央",       from: "", fixed: true, names: ["陈珂", "郑丹妮"], tag: "年度金曲" },
        { rank: 11, song: "honor",        from: "", fixed: true, team: "SNH48 Team HII", teamKey: "HII", tag: "年度荣耀队歌", last: true },
      ],
    },
    "2022": {   // 按用户口径挂载（2026-XX 批次）：本年无年度队歌（不设殿后条目）；
                // 前三锁史实；4~8名 2 人、9名 4 人、10名 7 人为人数口径，
                // 参演成员按人气生成（姓名待补充后可改 fixed 挂载）
      list: [
        { rank: 10, song: "MOONLIGHT",              from: "", gen: 7 },
        { rank: 9,  song: "花园舞曲",               from: "", gen: 4 },
        { rank: 8,  song: "Hold Me Tight",          from: "", gen: 2 },
        { rank: 7,  song: "9 TO 9",                 from: "", gen: 2 },
        { rank: 6,  song: "Look Out（讯号）",       from: "", gen: 2 },
        { rank: 5,  song: "美杜莎的温柔",           from: "", gen: 2 },
        { rank: 4,  song: "Liar（受理人）",         from: "", gen: 2 },
        { rank: 3,  song: "SWEET TRAP（影）",       from: "", fixed: true, names: ["姜杉", "费沁源"] },
        { rank: 2,  song: "未接来电",               from: "", fixed: true, names: ["张昕", "许杨玉琢"] },
        { rank: 1,  song: "渊（DEEP DOWN）",        from: "", fixed: true, names: ["蒋芸", "王晓佳"], tag: "年度金曲" },
      ],
    },
    "2023": {   // 按用户口径挂载（2026-XX 批次）：荣耀队歌《远方的海》SNH48 Team NII；
                // 前三锁史实；4~7名 2 人、8~9名 7 人、10名 2 人为人数口径，
                // 参演成员按人气生成（姓名待补充后可改 fixed 挂载）
      list: [
        { rank: 10, song: "低烧",                   from: "", gen: 2 },
        { rank: 9,  song: "触电",                   from: "", gen: 7 },
        { rank: 8,  song: "BEE WITH U",             from: "", gen: 7 },
        { rank: 7,  song: "笔下之城（DREAM）",      from: "", gen: 2 },
        { rank: 6,  song: "叹云兮",                 from: "", gen: 2 },
        { rank: 5,  song: "那好吧",                 from: "", gen: 2 },
        { rank: 4,  song: "黑与白",                 from: "", gen: 2 },
        { rank: 3,  song: "HATE 2 LOVE（曼陀罗）",  from: "", fixed: true, names: ["陈珂", "郑丹妮"] },
        { rank: 2,  song: "辛德瑞拉（CINDERELLA）", from: "", fixed: true, names: ["王晓佳"] },
        { rank: 1,  song: "失忆（UNAWARE）",        from: "", fixed: true, names: ["周诗雨", "王奕"], tag: "年度金曲" },
        { rank: 11, song: "远方的海",               from: "", fixed: true, team: "SNH48 Team NII", teamKey: "NII", tag: "年度荣耀队歌", last: true },
      ],
    },
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
