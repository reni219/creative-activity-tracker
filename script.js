
console.log("創作モチベ管理アプリ、起動！");

// ===== 画面の要素 =====
const button = document.getElementById("record-button");
const message = document.getElementById("message");
const activityList = document.getElementById("activity-list");

const levelDisplay = document.getElementById("creator-level");
const expDisplay = document.getElementById("current-exp");
const expBar = document.getElementById("exp-bar");
const streakDisplay = document.getElementById("streak-count");
const todayMinutesDisplay = document.getElementById("today-minutes");

// ===== 活動記録を保存する配列 =====
const STORAGE_KEY = "creativeMotivationActivities";
// 編集中の活動記録の位置。編集中でなければ null
let editingActivityIndex = null;
let activities = [];

try {
    const savedActivities = localStorage.getItem(STORAGE_KEY);

    if (savedActivities !== null) {
        activities = JSON.parse(savedActivities);
    }
} catch (error) {
    console.error("活動記録の読み込みに失敗:", error);
}
// ===== 活動記録を保存する =====
function saveActivities() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(activities)
        );
    } catch (error) {
        console.error("活動記録の保存に失敗:", error);
        message.textContent =
            "記録を保存できなかったよ。ブラウザの設定を確認してね。";
    }
}
let currentSummaryPeriod = "today";
let currentChartPeriod = "week";

// ===== 日付を取得する関数 =====
function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// 日付の差を計算する
function daysBetween(dateA, dateB) {
    const a = new Date(dateA + "T00:00:00");
    const b = new Date(dateB + "T00:00:00");

    return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// ===== 経験値を計算する関数 =====
function calculateExp(minutes) {
    return Math.max(1, Math.floor(minutes / 15));
}

// ===== 活動記録から合計値を計算する =====

function getTotalExp() {
    const activityExp = activities.reduce((total, activity) => {
        return total + calculateExp(activity.minutes);
    }, 0);

    return activityExp + getAchievementBonusExp();
}


function getTotalMinutes() {
    return activities.reduce((total, activity) => {
        return total + activity.minutes;
    }, 0);
}

 // ===== 実績の定義 =====
const achievements = [
    {
        id: "first-step",
        name: "はじめの一歩",
        description: "初めて活動を記録する",
        icon: "🌱",
        reward: 10,
        condition: () => activities.length >= 1
    },
    {
        id: "one-hour",
        name: "努力家",
        description: "累計60分活動する",
        icon: "⏰",
        reward: 20,
        condition: () => getTotalMinutes() >= 60
    },
    {
        id: "seven-days",
        name: "継続は力なり",
        description: "異なる7日間に活動する",
        icon: "📅",
        reward: 30,
        condition: () =>
            new Set(activities.map(activity => activity.date)).size >= 7
    },
    {
        id: "three-genres",
        name: "万能創作者",
        description: "3種類のジャンルで活動する",
        icon: "🎨",
        reward: 30,
        condition: () =>
            new Set(activities.map(activity => activity.genre)).size >= 3
    },
    {
        id: "genre-novel",
        name: "言葉を紡ぐ者",
        description: "小説ジャンルで活動する",
        icon: "📖",
        reward: 15,
        condition: () =>
            activities.some(activity => activity.genre === "小説")
    },
    {
        id: "genre-illustration",
        name: "線を描く者",
        description: "イラストジャンルで活動する",
        icon: "🖌️",
        reward: 15,
        condition: () =>
            activities.some(activity => activity.genre === "イラスト")
    },
    {
        id: "genre-manga",
        name: "物語を描く者",
        description: "漫画ジャンルで活動する",
        icon: "📚",
        reward: 15,
        condition: () =>
            activities.some(activity => activity.genre === "漫画")
    },
    {
        id: "genre-music",
        name: "音を生み出す者",
        description: "作曲ジャンルで活動する",
        icon: "🎵",
        reward: 15,
        condition: () =>
            activities.some(activity => activity.genre === "作曲")
    },
    {
        id: "genre-video",
        name: "一瞬を紡ぐ者",
        description: "動画ジャンルで活動する",
        icon: "🎬",
        reward: 15,
        condition: () =>
            activities.some(activity => activity.genre === "動画")
    },
    {
        id: "genre-game",
        name: "世界を組み立てる者",
        description: "ゲーム制作ジャンルで活動する",
        icon: "🎮",
        reward: 15,
        condition: () =>
            activities.some(activity => activity.genre === "ゲーム制作")
    },
    {
        id: "genre-other",
        name: "未知への寄り道",
        description: "その他ジャンルで活動する",
        icon: "🌈",
        reward: 10,
        condition: () =>
            activities.some(activity => activity.genre === "その他")
    }, 
    
    {
        id: "five-activities",
        name: "創作の申し子",
        description: "活動を累計5回記録する",
        icon: "✍️",
        reward: 15,
        condition: () => activities.length >= 5
    },
    {
        id: "ten-activities",
        name: "創作中毒",
        description: "活動を累計10回記録する",
        icon: "🔥",
        reward: 30,
        condition: () => activities.length >= 10
    },
    {
        id: "fifty-activities",
        name: "積み重ねの結晶",
        description: "活動を累計50回記録する",
        icon: "💎",
        reward: 100,
        condition: () => activities.length >= 50
    },
    {
        id: "five-hours",
        name: "没頭する者",
        description: "累計300分活動する",
        icon: "🕰️",
        reward: 40,
        condition: () => getTotalMinutes() >= 300
    },
    {
        id: "ten-hours",
        name: "長い道のり",
        description: "累計600分活動する",
        icon: "🌟",
        reward: 70,
        condition: () => getTotalMinutes() >= 600
    },
    {
        id: "three-days",
        name: "習慣の芽",
        description: "異なる3日間に活動する",
        icon: "🌱",
        reward: 15,
        condition: () =>
            new Set(activities.map(activity => activity.date)).size >= 3
    },
    {
        id: "thirty-days",
        name: "常連創作者",
        description: "異なる30日間に活動する",
        icon: "🗓️",
        reward: 100,
        condition: () =>
            new Set(activities.map(activity => activity.date)).size >= 30
    },
    {
        id: "five-genres",
        name: "越境する創作者",
        description: "5種類のジャンルで活動する",
        icon: "🌐",
        reward: 70,
        condition: () =>
            new Set(activities.map(activity => activity.genre)).size >= 5
    },
    {
        id: "all-genres",
        name: "全域制覇",
        description: "7種類すべてのジャンルで活動する",
        icon: "👑",
        reward: 150,
        condition: () =>
            new Set(activities.map(activity => activity.genre)).size >= 7
    },

];

// 現在の記録で解除済みの実績を取得する
function getUnlockedAchievements() {
    return achievements.filter(achievement => achievement.condition());
}

// 解除済み実績のボーナスEXPを合計する
function getAchievementBonusExp() {
    return getUnlockedAchievements().reduce(
        (total, achievement) => total + achievement.reward,
        0
    );
}
function getUnlockedAchievementIds() {
    return new Set(
        getUnlockedAchievements().map(achievement => achievement.id)
    );
}
let previousUnlockedAchievementIds = null;


function checkNewAchievements() {
    const unlocked = getUnlockedAchievements();
    const unlockedIds = new Set(
        unlocked.map(achievement => achievement.id)
    );

    // 初回は現在の解除状態を記録するだけ
    if (previousUnlockedAchievementIds === null) {
        previousUnlockedAchievementIds = unlockedIds;
        return;
    }

    const newlyUnlocked = unlocked.filter(
        achievement =>
            !previousUnlockedAchievementIds.has(achievement.id)
    );

    const noticeArea = document.getElementById(
        "achievement-notices"
    );

    if (noticeArea) {
        for (const achievement of newlyUnlocked) {
            const notice = document.createElement("div");
            notice.className = "achievement-notice";
            notice.textContent =
                `🏆 実績解除！\n${achievement.name}\n` +
                `報酬：${achievement.reward} EXP`;


            noticeArea.appendChild(notice);
        }
    }

    // 今回の解除状態を次回の比較用に保存
    previousUnlockedAchievementIds = unlockedIds;
}

 // ===== 実績一覧を表示する =====
function renderAchievements() {
    const list = document.getElementById("achievement-list");
    const progressText = document.getElementById(
        "achievement-progress-text"
    );
    const progressBar = document.getElementById(
        "achievement-progress-bar"
    );

    if (!list || !progressText || !progressBar) {
        return;
    }

    const unlocked = getUnlockedAchievements();
    const unlockedIds = new Set(
        unlocked.map(achievement => achievement.id)
    );

    
    list.replaceChildren();

    // 達成済みの実績を先に表示する
    const sortedAchievements = [...achievements].sort((a, b) => {
        const aUnlocked = unlockedIds.has(a.id);
        const bUnlocked = unlockedIds.has(b.id);

        return Number(bUnlocked) - Number(aUnlocked);
    });

    for (const achievement of sortedAchievements) {

        const isUnlocked = unlockedIds.has(achievement.id);

        const card = document.createElement("div");
        card.className = isUnlocked
            ? "achievement-card unlocked"
            : "achievement-card locked";

        const badge = document.createElement("div");
        badge.className = "achievement-badge";
        badge.textContent = isUnlocked ? achievement.icon : "🔒";

        const info = document.createElement("div");
        info.className = "achievement-info";

        const title = document.createElement("h3");
        title.textContent = achievement.name;

        const description = document.createElement("p");
        description.textContent = achievement.description;

        const status = document.createElement("p");
        status.textContent = isUnlocked ? "解除済み！" : "未解除";

        const reward = document.createElement("p");
        reward.className = "achievement-reward";
        reward.textContent = `報酬：${achievement.reward} EXP`;

        info.append(title, description, status, reward);
        card.append(badge, info);
        list.appendChild(card);
    }

    const count = unlocked.length;
    const total = achievements.length;
    const percentage = Math.round((count / total) * 100);

    progressText.textContent =
        `${count} / ${total}（${percentage}%）`;

    progressBar.max = total;
    progressBar.value = count;
}


// ===== レベルを計算する =====
function getLevel(totalExp) {
    let level = 1;
    let requiredExp = 4;
    let remainingExp = totalExp;

    while (remainingExp >= requiredExp) {
        remainingExp -= requiredExp;
        level++;
        requiredExp += 2;
    }

    return level;
}

function getLevelTitle(level) {
    if (level >= 20) {
        return "実りを重ねて";
    } else if (level >= 15) {
        return "枝葉の広がり";
    } else if (level >= 10) {
        return "根を張る日々";
    } else if (level >= 5) {
        return "芽吹きの途中";
    } else {
        return "はじまりの種";
    }
}

const creatorMessages = [
    "今日も一歩、創作が進んだね。",
    "小さな積み重ねが、いつか形になる。",
    "思い描いたものを、少しずつ形にしていこう。",
    "休む日も、また作るための時間。",
    "昨日の自分とは違う発見があるかも。",
    "完成までの道のりも、創作の一部。",
    "自分のペースで、ゆっくりいこう。",
    "今日のひと工夫が、未来の自分を助ける。",
    "うまくいかない日も、経験は残っている。",
    "作りたいと思った気持ちを、大切に。",
    "小さな一歩も、積み重ねれば大きな成果。"
];

function getRandomCreatorMessage() {
    const index = Math.floor(
        Math.random() * creatorMessages.length
    );

    return creatorMessages[index];
}
function updateCreatorMessage() {
    const messageElement =
        document.getElementById("creator-message");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = getRandomCreatorMessage();
}
 // ===== レベルアップ演出 =====
let previousLevel = null;


function checkLevelUp(levelBefore) {
    const currentLevel = getLevel(getTotalExp());

    // レベルが上がっていなければ何もしない
    if (currentLevel <= levelBefore) {
        return;
    }

    const noticeArea = document.getElementById(
        "level-up-notices"
    );

    if (noticeArea) {
        const notice = document.createElement("div");
        notice.className = "level-up-notice";
        notice.textContent =
            `🎉 LEVEL UP！ 🎉\n` +
            `レベル ${levelBefore} → ${currentLevel}`;


        noticeArea.replaceChildren(notice);
    }
}


// ===== 連続活動日数を計算する =====
function getStreak() {
    const dates = [...new Set(
        activities.map(activity => activity.date)
    )].sort();

    if (dates.length === 0) {
        return 0;
    }

    const today = getToday();
    const lastDate = dates[dates.length - 1];

    // 今日も昨日も活動していないなら連続記録は0日
    const gap = daysBetween(lastDate, today);

    if (gap > 1 || gap < 0) {
        return 0;
    }

    let streak = 1;

    for (let i = dates.length - 1; i > 0; i--) {
        if (daysBetween(dates[i - 1], dates[i]) === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

// ===== ホーム画面を更新する =====
function updateDashboard() {
    const totalExp = getTotalExp();
    const level = getLevel(totalExp);
    document.getElementById("level-title").textContent =
    getLevelTitle(level);
    let remainingExp = totalExp;
    let requiredExp = 4;

    while (remainingExp >= requiredExp) {
        remainingExp -= requiredExp;
        requiredExp += 2;
    }

    const expInLevel = remainingExp;

    const todayMinutes = activities
        .filter(activity => activity.date === getToday())
        .reduce((total, activity) => total + activity.minutes, 0);

    levelDisplay.textContent = level;
    expDisplay.textContent = `${expInLevel} / ${requiredExp}`;
    expBar.value = expInLevel;
    expBar.max = requiredExp;
    streakDisplay.textContent = getStreak();
    todayMinutesDisplay.textContent = formatActivityTime(todayMinutes);
}

function updateTotalActivity() {
    console.log("活動記録の中身:", JSON.stringify(activities, null, 2));
    // 累計活動日数：活動した日付の重複を取り除く
    const uniqueDays = new Set(
        activities.map(activity => activity.date)
    );

    // 累計活動時間：すべての記録の時間を合計する
    const totalMinutes = activities.reduce(
        (total, activity) => total + activity.minutes,
        0
    );

    document.getElementById("total-days").textContent =
        uniqueDays.size;
        
    document.getElementById("total-minutes").textContent =
        formatActivityTime(totalMinutes);
}


// ===== 活動履歴を画面に表示する =====
// ===== 分を「〇時間〇分」の表記に変換する =====
function formatActivityTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes}分`;
    }

    if (minutes === 0) {
        return `${hours}時間`;
    }

    return `${hours}時間${minutes}分`;
}
function renderActivities() {
    activityList.replaceChildren();

    // 新しい記録を先に表示
    const sortedActivities = [...activities].reverse();

    for (let i = 0; i < sortedActivities.length; i++) {
        const activity = sortedActivities[i];

        // 元の配列での位置を取得
        const originalIndex = activities.length - 1 - i;

        const item = document.createElement("li");
        const title = document.createElement("strong");
        const detail = document.createElement("p");
        const deleteButton = document.createElement("button");
const editButton = document.createElement("button");

editButton.textContent = "編集";
editButton.type = "button";

editButton.addEventListener("click", () => {
    editingActivityIndex = originalIndex;

    document.getElementById("genre").value = activity.genre;
    document.getElementById("hours").value =
        Math.floor(activity.minutes / 60);
    document.getElementById("minutes").value =
        activity.minutes % 60;
    document.getElementById("memo").value = activity.memo || "";

    button.textContent = "変更を保存";

    // キャンセルボタンがなければ作る
    let cancelButton =
        document.getElementById("cancel-activity-edit");

    if (!cancelButton) {
        cancelButton = document.createElement("button");
        cancelButton.id = "cancel-activity-edit";
        cancelButton.type = "button";
        cancelButton.textContent = "編集をキャンセル";

        cancelButton.addEventListener("click", cancelEditActivity);

        button.insertAdjacentElement("afterend", cancelButton);
    }

    message.textContent = "活動記録を編集中だよ。変更したら保存してね。";

    document.getElementById("genre").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});
        title.textContent =
        `${activity.date}　${activity.genre}・${formatActivityTime(activity.minutes)}`;

        detail.textContent = activity.memo || "メモなし";

        // 削除ボタン
        deleteButton.textContent = "削除";
        deleteButton.type = "button";

    deleteButton.addEventListener("click", () => {
        const confirmed = confirm(
            `${activity.date}の「${activity.genre}」の記録を削除しますか？`
        );

        if (!confirmed) {
            return;
        }

        // 元の配列から記録を削除
        activities.splice(originalIndex, 1);

        // 削除後のデータを保存
        saveActivities();

        // 画面を更新
        renderActivities();
        renderAchievements();
        updateDashboard();
        updateTotalActivity();
        updateSummary(currentSummaryPeriod);
        updatePeriodChart(currentChartPeriod);
        updateGenreChart(currentChartPeriod);
    });

    item.appendChild(title);
    item.appendChild(detail);
    item.appendChild(editButton);
    item.appendChild(deleteButton);

    activityList.appendChild(item);
}

}

// ===== 活動を記録する処理 =====
function recordActivity() {
    const levelBefore = getLevel(getTotalExp());
    const activityDate = document.getElementById("activity-date").value;
    const genre = document.getElementById("genre").value;
    const hoursInput = document.getElementById("hours").value;
    const minutesInput = document.getElementById("minutes").value;

    const hours = Number(hoursInput);
    const extraMinutes = Number(minutesInput);
    const minutes = hours * 60 + extraMinutes;
    const memo = document.getElementById("memo").value.trim();

    if (
        !activityDate ||
        hoursInput.trim() === "" ||
        minutesInput.trim() === "" ||
        !Number.isInteger(hours) ||
        !Number.isInteger(extraMinutes) ||
        hours < 0 ||
        extraMinutes < 0 ||
        extraMinutes > 59 ||
        minutes <= 0
    ) {
        message.textContent =
        "活動時間を1分以上で入力してね（分は0〜59）。";
        return;
    }

    if (editingActivityIndex !== null) {
        // 編集対象が存在するか確認
        if (!activities[editingActivityIndex]) {
            message.textContent =
            "編集対象の記録が見つからなかったよ。";
            cancelEditActivity();
            return;
        }

        // 元の日付を維持して内容を更新
        const oldActivity = activities[editingActivityIndex];

        activities[editingActivityIndex] = {
            date: activityDate,
            genre: genre,
            minutes: minutes,
            memo: memo
        };

        saveActivities();
        message.textContent = "活動記録を更新したよ！";
    } else {
        // 新規記録を追加
        const activity = {
            date: activityDate,
            genre: genre,
            minutes: minutes,
            memo: memo
        };

        activities.push(activity);
        saveActivities();

        const earnedExp = calculateExp(minutes);
        message.textContent =
        `活動を記録したよ！ +${earnedExp} EXP\nお疲れさま！`;
    }

    // フォームを新規登録の状態に戻す
    editingActivityIndex = null;
    button.textContent = "活動を記録する";

    document.getElementById("hours").value = "0";
    document.getElementById("minutes").value = "0";
    document.getElementById("memo").value = "";

    
    renderActivities();
    checkNewAchievements();
    checkLevelUp(levelBefore);
    renderAchievements();
    updateDashboard();
    updateTotalActivity();
    updateSummary(currentSummaryPeriod);
    updatePeriodChart(currentChartPeriod);
    updateGenreChart(currentChartPeriod);
}
function cancelEditActivity() {
editingActivityIndex = null;
document.getElementById("activity-date").value = getToday();

document.getElementById("genre").value = "小説";
document.getElementById("hours").value = "0";
document.getElementById("minutes").value = "0";
document.getElementById("memo").value = "";

button.textContent = "活動を記録する";
message.textContent = "編集をキャンセルしたよ。";

const cancelButton =
    document.getElementById("cancel-activity-edit");

if (cancelButton) {
    cancelButton.remove();
}

}
/* 記録ボタンをクリックしたとき */
button.addEventListener("click", recordActivity);

/* 時間入力欄で Enter を押したとき */
document.getElementById("minutes").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        recordActivity();
    }
});
// ===== 目標管理 =====
const GOALS_STORAGE_KEY = "creativeMotivationGoals";

let goals = [];
// 編集中の目標ID。新規登録中は null
let editingGoalId = null;
try {
    const savedGoals = localStorage.getItem(GOALS_STORAGE_KEY);

    if (savedGoals !== null) {
        const parsedGoals = JSON.parse(savedGoals);

        if (Array.isArray(parsedGoals)) {
            goals = parsedGoals.filter(goal =>
                goal &&
                typeof goal.id === "string" &&
                typeof goal.name === "string" &&
                Number.isFinite(goal.target) &&
                Number.isFinite(goal.current) &&
                typeof goal.unit === "string" &&
                typeof goal.deadline === "string" &&
                Number.isFinite(new Date(goal.deadline).getTime())
            );
        }
    }
} catch (error) {
    console.error("目標の読み込みに失敗:", error);
}

function saveGoals() {
    try {
        localStorage.setItem(
            GOALS_STORAGE_KEY,
            JSON.stringify(goals)
        );
        return true;
    } catch (error) {
        console.error("目標の保存に失敗:", error);
        return false;
    }
}
// ===== 目標の編集を開始する =====
function startEditGoal(goalId) {
    const goal = goals.find(item => item.id === goalId);

    if (!goal) {
        return;
    }

    editingGoalId = goal.id;

    document.getElementById("goal-name").value = goal.name;
    document.getElementById("goal-target").value = goal.target;
    document.getElementById("goal-current").value = goal.current;

    const unitSelect = document.getElementById("goal-unit");
    const standardUnits = [
        "枚", "ページ", "曲", "個", "回", "文字", "時間"
    ];

    if (standardUnits.includes(goal.unit)) {
        unitSelect.value = goal.unit;
        document.getElementById("custom-unit-container").hidden = true;
        document.getElementById("goal-custom-unit").value = "";
    } else {
        unitSelect.value = "custom";
        document.getElementById("custom-unit-container").hidden = false;
        document.getElementById("goal-custom-unit").value = goal.unit;
    }

    // datetime-local が受け取れる形式に変換
    const deadline = new Date(goal.deadline);
    const localDeadline = new Date(
        deadline.getTime() - deadline.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 16);

    document.getElementById("goal-deadline").value = localDeadline;

    document.getElementById("goal-submit-btn").textContent = "変更を保存";
    document.getElementById("goal-cancel-edit-btn").hidden = false;
    document.getElementById("goal-message").textContent =
        "目標を編集中だよ。変更したら「変更を保存」を押してね。";

    document.getElementById("goal-form").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ===== 編集をキャンセルする =====
function cancelEditGoal() {
    editingGoalId = null;

    document.getElementById("goal-form").reset();
    document.getElementById("custom-unit-container").hidden = true;
    document.getElementById("goal-submit-btn").textContent = "目標を追加";
    document.getElementById("goal-cancel-edit-btn").hidden = true;
    document.getElementById("goal-message").textContent =
        "編集をキャンセルしたよ。";
}

document.getElementById("goal-cancel-edit-btn").addEventListener(
    "click",
    cancelEditGoal
);
// ===== 目標を追加する =====
function addGoal(goalData) {
    goals.push(goalData);

    if (!saveGoals()) {
        goals.pop();
        document.getElementById("goal-message").textContent =
            "保存できなかったよ。ブラウザの設定や保存容量を確認してね。";
        return;
    }

    document.getElementById("goal-form").reset();
    document.getElementById("custom-unit-container").hidden = true;
    document.getElementById("goal-message").textContent =
        "目標を追加したよ！";

    renderGoals();
}
// 「任意の単位」を選んだときだけ入力欄を表示する
document.getElementById("goal-unit").addEventListener("change", function () {
    const customContainer =
        document.getElementById("custom-unit-container");

    customContainer.hidden = this.value !== "custom";
});

// 目標登録フォーム
document.getElementById("goal-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("goal-name").value.trim();
    const target = Number(document.getElementById("goal-target").value);
    const unitSelect = document.getElementById("goal-unit").value;
    const customUnit =
        document.getElementById("goal-custom-unit").value.trim();
    const deadlineInput =
        document.getElementById("goal-deadline").value;
    const current = Number(document.getElementById("goal-current").value);

    const unit = unitSelect === "custom" ? customUnit : unitSelect;
    const deadlineDate = new Date(deadlineInput);

    if (!name || !unit || !deadlineInput) {
        document.getElementById("goal-message").textContent =
            "目標名・単位・締切日時を入力してね。";
        return;
    }

    if (
        !Number.isFinite(target) ||
        target <= 0 ||
        !Number.isFinite(current) ||
        current < 0
    ) {
        document.getElementById("goal-message").textContent =
            "目標数量は0より大きく、進捗は0以上の数値にしてね。";
        return;
    }

    if (!Number.isFinite(deadlineDate.getTime())) {
        document.getElementById("goal-message").textContent =
            "正しい締切日時を設定してね。";
        return;
    }

    const goalData = {
        id: editingGoalId ||
            Date.now().toString() + "-" + Math.random().toString(36).slice(2),
        name: name,
        target: target,
        unit: unit,
        current: current,
        deadline: deadlineDate.toISOString()
    };

    const previousGoals = goals.map(goal => ({ ...goal }));

    if (editingGoalId !== null) {
        const index = goals.findIndex(goal => goal.id === editingGoalId);

        if (index === -1) {
            document.getElementById("goal-message").textContent =
                "編集対象の目標が見つからなかったよ。";
            cancelEditGoal();
            return;
        }

        goals[index] = goalData;
    } else {
        goals.push(goalData);
    }

    if (!saveGoals()) {
        goals = previousGoals;
        document.getElementById("goal-message").textContent =
            "保存できなかったよ。変更は保存されていません。";
        renderGoals();
        return;
    }

    const wasEditing = editingGoalId !== null;

    editingGoalId = null;
    document.getElementById("goal-form").reset();
    document.getElementById("custom-unit-container").hidden = true;
    document.getElementById("goal-submit-btn").textContent = "目標を追加";
    document.getElementById("goal-cancel-edit-btn").hidden = true;
    document.getElementById("goal-message").textContent =
        wasEditing ? "目標を更新したよ！" : "目標を追加したよ！";

    renderGoals();
});
// ===== 達成率を計算する =====
function calculateGoalProgress(goal) {
    return Math.round((goal.current / goal.target) * 100);
}

// ===== 目標の状態を判定する =====
function getGoalStatus(goal) {
    if (goal.current >= goal.target) {
        return {
            text: "達成！",
            className: "completed"
        };
    }

    if (new Date(goal.deadline).getTime() <= Date.now()) {
        return {
            text: "締切超過",
            className: "expired"
        };
    }

    return {
        text: "進行中",
        className: "active"
    };
}

// ===== 残り時間を表示する文字列に変換する =====
function formatGoalCountdown(deadline) {
    const remaining =
        new Date(deadline).getTime() - Date.now();

    if (remaining <= 0) {
        return "締切を過ぎています";
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `残り ${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`;
}

// ===== 締切日時を読みやすく表示する =====
function formatGoalDeadline(deadline) {
    return new Date(deadline).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}
// ===== 目標一覧を表示する =====
function renderGoals() {
    const container = document.getElementById("goals-container");
    container.replaceChildren();

    if (goals.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "目標はまだ登録されていないよ。";
        container.appendChild(emptyMessage);
        return;
    }

    goals.forEach(function (goal) {
        const card = document.createElement("div");
        card.className = "goal-card";

        const title = document.createElement("h3");
        title.textContent = goal.name;
        card.appendChild(title);

        const status = getGoalStatus(goal);
        const statusLabel = document.createElement("span");
        statusLabel.className = `goal-status ${status.className}`;
        statusLabel.dataset.goalStatus = goal.id;
        statusLabel.textContent = status.text;
        card.appendChild(statusLabel);

        const deadline = document.createElement("p");
        deadline.className = "goal-details";
        deadline.textContent =
            `締切：${formatGoalDeadline(goal.deadline)}`;
        card.appendChild(deadline);

        const countdown = document.createElement("p");
        countdown.className = "goal-countdown";
        countdown.dataset.goalCountdown = goal.id;
        countdown.textContent = formatGoalCountdown(goal.deadline);
        card.appendChild(countdown);

        const details = document.createElement("p");
        details.className = "goal-details";
        details.textContent =
            `目標：${goal.target} ${goal.unit} ／ 現在：${goal.current} ${goal.unit}`;
        card.appendChild(details);

        const percentage = calculateGoalProgress(goal);

        const progressText = document.createElement("p");
        progressText.className = "goal-details";
        progressText.dataset.goalProgressText = goal.id;
        progressText.textContent = `達成率：${percentage}%`;
        card.appendChild(progressText);

        const progressBar = document.createElement("div");
        progressBar.className = "goal-progress-bar";

        const progressFill = document.createElement("div");
        progressFill.className = "goal-progress-fill";
        progressFill.dataset.goalProgressBar = goal.id;
        progressFill.style.width =
            `${Math.min(100, Math.max(0, percentage))}%`;

        progressBar.appendChild(progressFill);
        card.appendChild(progressBar);

        const progressForm = document.createElement("form");
        progressForm.className = "goal-progress-input";

        const progressLabel = document.createElement("label");
        progressLabel.textContent = "進捗を変更：";

        const progressInput = document.createElement("input");
        progressInput.type = "number";
        progressInput.min = "0";
        progressInput.step = "any";
        progressInput.value = goal.current;
        progressInput.required = true;
        progressInput.setAttribute(
            "aria-label",
            `${goal.name}の現在の進捗`
        );

        const updateButton = document.createElement("button");
        updateButton.type = "submit";
        updateButton.textContent = "更新";

        progressForm.append(
            progressLabel,
            progressInput,
            updateButton
        );

        progressForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const newCurrent = Number(progressInput.value);

            if (!Number.isFinite(newCurrent) || newCurrent < 0) {
                return;
            }

            const oldCurrent = goal.current;
            goal.current = newCurrent;

            if (!saveGoals()) {
                goal.current = oldCurrent;
                progressInput.value = oldCurrent;
                alert("進捗を保存できなかったよ。");
                return;
            }

            renderGoals();
        });

        card.appendChild(progressForm);

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "編集";

        editButton.addEventListener("click", function () {
            startEditGoal(goal.id);
        });

        card.appendChild(editButton);
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "goal-delete-button";
        deleteButton.textContent = "目標を削除";

        deleteButton.addEventListener("click", function () {
            const confirmed = confirm(
                `「${goal.name}」を削除してもいい？`
            );

            if (!confirmed) {
                return;
            }

            const index = goals.findIndex(item => item.id === goal.id);

            if (index === -1) {
                return;
            }

            const removedGoal = goals.splice(index, 1)[0];

            if (!saveGoals()) {
                goals.splice(index, 0, removedGoal);
                alert("削除を保存できなかったよ。");
                return;
            }

            renderGoals();
        });

        card.appendChild(deleteButton);
        container.appendChild(card);
    });
}
// ===== 残り時間と目標の状態を更新する =====
function updateGoalCountdowns() {
    document.querySelectorAll("[data-goal-countdown]").forEach(function (element) {
        const goal = goals.find(
            item => item.id === element.dataset.goalCountdown
        );

        if (!goal) {
            return;
        }

        element.textContent = formatGoalCountdown(goal.deadline);

        const statusElement = document.querySelector(
            `[data-goal-status="${goal.id}"]`
        );

        if (statusElement) {
            const status = getGoalStatus(goal);
            statusElement.textContent = status.text;
            statusElement.className =
                `goal-status ${status.className}`;
        }
    });
}
// ===== 初期表示 =====
const summaryMenu = document.getElementById("summary-menu");
document.getElementById("activity-date").value = getToday();

function updateSummary(period) {
    currentSummaryPeriod = period;
    const today = getToday();
    const currentMonth = today.slice(0, 7);
    const currentYear = today.slice(0, 4);

    // 選択した期間の記録を取り出す
    const filtered = activities.filter(activity => {
        if (period === "today") {
            return activity.date === today;
        }

        if (period === "month") {
            return activity.date.startsWith(currentMonth);
        }

        if (period === "year") {
            return activity.date.startsWith(currentYear);
        }

        return period === "all";
    });

    // 集計
    const totalMinutes = filtered.reduce(
        (total, activity) => total + activity.minutes,
        0
    );

    const activeDays = new Set(
        filtered.map(activity => activity.date)
    ).size;

    const titles = {
        today: "今日の活動",
        month: "今月の活動",
        year: "今年の活動",
        all: "これまでの活動"
    };

    document.getElementById("summary-title").textContent =
        titles[period];

    document.getElementById("summary-minutes").textContent =
    formatActivityTime(totalMinutes);

    document.getElementById("summary-days").textContent =
        activeDays;

    document.getElementById("summary-records").textContent =
        filtered.length;

    // 期間内の活動記録を一覧表示
    const list = document.getElementById("summary-activity-list");
    list.replaceChildren();

    // 新しい活動から順に並べる
    const sorted = [...filtered].reverse();

    if (sorted.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "この期間の活動記録はまだないよ。";
        list.appendChild(emptyItem);
        return;
    }

    for (const activity of sorted) {
        const item = document.createElement("li");

        const heading = document.createElement("strong");
        heading.textContent =
        `${activity.date}｜${activity.genre}｜${formatActivityTime(activity.minutes)}`;
    
        const memo = document.createElement("p");
        memo.textContent = activity.memo || "メモなし";

        item.appendChild(heading);
        item.appendChild(memo);
        list.appendChild(item);
    }
}


// メニューを押したら集計を切り替える
summaryMenu.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-period]");
    if (!button) return;

    const period = button.dataset.period;

    updateSummary(period);
});
const chartPeriodMenu = document.getElementById("chart-period-menu");

chartPeriodMenu.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-period]");
    if (!button) return;

    currentChartPeriod = button.dataset.period;

    updatePeriodChart(currentChartPeriod);
    updateGenreChart(currentChartPeriod);
});

// 期間ごとの活動時間グラフ
const periodCanvas = document.getElementById("period-chart");

const periodChart = new Chart(periodCanvas, {
    type: "bar",
    data: {
        labels: [],
        datasets: [{
            label: "活動時間（分）",
            data: [],
            backgroundColor: "#b8a9d9"
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "活動時間（分）"
                }
            }
        }
    }
});
// ジャンルごとの活動時間グラフ
const genreCanvas = document.getElementById("genre-chart");

const genreChart = new Chart(genreCanvas, {
    type: "bar",
    data: {
        labels: [],
        datasets: [{
            label: "活動時間（分）",
            data: [],
            backgroundColor: "#9fc9c2"
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "活動時間（分）"
                }
            }
        }
    }
});
// グラフのデータを更新する

function updatePeriodChart(period) {
    const today = getToday();
    const todayDate = new Date(today + "T00:00:00");

    let labels = [];
    let values = [];
    const totals = {};

    // 一週間：直近7日間を日ごとに表示
    if (period === "week") {
        const startDate = new Date(todayDate);
        startDate.setDate(startDate.getDate() - 6);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const key =
                date.getFullYear() + "-" +
                String(date.getMonth() + 1).padStart(2, "0") + "-" +
                String(date.getDate()).padStart(2, "0");

            labels.push((date.getMonth() + 1) + "/" + date.getDate());
            totals[key] = 0;
        }

        for (const activity of activities) {
            if (Object.hasOwn(totals, activity.date)) {
                totals[activity.date] += activity.minutes;
            }
        }

        values = Object.values(totals);

        document.getElementById("period-chart-description").textContent =
            "直近7日間の活動時間を日ごとに表示しているよ。";
    }

    // 今月：今月の日ごとに表示
    else if (period === "month") {
        const year = todayDate.getFullYear();
        const month = todayDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const key =
                year + "-" +
                String(month + 1).padStart(2, "0") + "-" +
                String(day).padStart(2, "0");

            labels.push(day + "日");
            totals[key] = 0;
        }

        for (const activity of activities) {
            if (Object.hasOwn(totals, activity.date)) {
                totals[activity.date] += activity.minutes;
            }
        }

        values = Object.values(totals);

        document.getElementById("period-chart-description").textContent =
            "今月の活動時間を日ごとに表示しているよ。";
    }

    // 今年：今年の月ごとに表示
    else if (period === "year") {
        const year = todayDate.getFullYear();

        for (let month = 1; month <= 12; month++) {
            const key = year + "-" + String(month).padStart(2, "0");

            labels.push(month + "月");
            totals[key] = 0;
        }

        for (const activity of activities) {
            const key = activity.date.slice(0, 7);

            if (Object.hasOwn(totals, key)) {
                totals[key] += activity.minutes;
            }
        }

        values = Object.values(totals);

        document.getElementById("period-chart-description").textContent =
            "今年の活動時間を月ごとに表示しているよ。";
    }

    // これまで：年ごとに表示
    else if (period === "all") {
        if (activities.length > 0) {
            const years = activities.map(activity =>
                Number(activity.date.slice(0, 4))
            );

            const firstYear = Math.min(...years);
            const lastYear = todayDate.getFullYear();

            for (let year = firstYear; year <= lastYear; year++) {
                labels.push(year + "年");
                totals[String(year)] = 0;
            }

            for (const activity of activities) {
                const year = activity.date.slice(0, 4);
                totals[year] += activity.minutes;
            }

            values = Object.values(totals);
        }

        document.getElementById("period-chart-description").textContent =
            "これまでの活動時間を年ごとに表示しているよ。";
    }

    periodChart.data.labels = labels;
    periodChart.data.datasets[0].data = values;
    periodChart.update();
}

// ジャンル別グラフのデータを更新する

function updateGenreChart(period) {
    const today = getToday();
    const todayDate = new Date(today + "T00:00:00");

    let startDate = "";
    let endDate = today;
    let filtered = activities;

    // 選択した期間に応じて集計対象を絞り込む
    if (period === "week") {
        const start = new Date(todayDate);
        start.setDate(start.getDate() - 6);

        startDate =
            start.getFullYear() + "-" +
            String(start.getMonth() + 1).padStart(2, "0") + "-" +
            String(start.getDate()).padStart(2, "0");

        filtered = activities.filter(activity =>
            activity.date >= startDate &&
            activity.date <= endDate
        );
    } else if (period === "month") {
        const monthStart = today.slice(0, 7) + "-01";

        filtered = activities.filter(activity =>
            activity.date >= monthStart &&
            activity.date <= endDate
        );
    } else if (period === "year") {
        const yearStart = today.slice(0, 4) + "-01-01";

        filtered = activities.filter(activity =>
            activity.date >= yearStart &&
            activity.date <= endDate
        );
    }

    // ジャンルごとに活動時間を合計する
    const totals = {};

    for (const activity of filtered) {
        totals[activity.genre] =
            (totals[activity.genre] || 0) + activity.minutes;
    }

    genreChart.data.labels = Object.keys(totals);
    genreChart.data.datasets[0].data = Object.values(totals);

    genreChart.update();
}


renderActivities();
updateDashboard();
updateCreatorMessage();
updateTotalActivity();
updateSummary("today");
updatePeriodChart(currentChartPeriod);
updateGenreChart(currentChartPeriod);

// 起動時点で解除済みの実績を記録しておく
previousUnlockedAchievementIds = new Set(
    getUnlockedAchievements().map(achievement => achievement.id)
);

renderAchievements();

// 目標を表示して、残り時間の更新を開始する
renderGoals();
updateGoalCountdowns();
setInterval(updateGoalCountdowns, 1000);

 // ===== 創作カレンダー =====
let calendarYear = Number(getToday().slice(0, 4));
let calendarMonth = Number(getToday().slice(5, 7)) - 1;
let selectedCalendarDate = getToday();

function renderCalendar() {
    const monthTitle = document.getElementById("calendar-month");
    const daysContainer = document.getElementById("calendar-days");

    if (!monthTitle || !daysContainer) return;

    monthTitle.textContent =
        `${calendarYear}年${calendarMonth + 1}月`;

    daysContainer.replaceChildren();

    // 日付ごとの活動時間を集計
    const dailyMinutes = {};

    for (const activity of activities) {
        dailyMinutes[activity.date] =
            (dailyMinutes[activity.date] || 0) + activity.minutes;
    }

    // 月曜日始まりにするため、日曜日を6に変換
    const firstDay = new Date(
        calendarYear, calendarMonth, 1
    ).getDay();

    const startOffset = (firstDay + 6) % 7;

    const daysInMonth = new Date(
        calendarYear, calendarMonth + 1, 0
    ).getDate();

    // 月初の前に空欄を追加
    for (let i = 0; i < startOffset; i++) {
        const blank = document.createElement("div");
        blank.setAttribute("aria-hidden", "true");
        daysContainer.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date =
            `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayButton = document.createElement("button");
        dayButton.type = "button";
        dayButton.className = "calendar-day";
        dayButton.textContent = day;

        if (dailyMinutes[date]) {
            dayButton.classList.add("has-activity");

            const dot = document.createElement("span");
            dot.className = "calendar-dot";
            dot.setAttribute("aria-hidden", "true");
            dayButton.appendChild(dot);

            dayButton.setAttribute(
                "aria-label",
                `${day}日、創作活動 ${formatActivityTime(dailyMinutes[date])}`
            );
        } else {
            dayButton.setAttribute("aria-label", `${day}日`);
        }

        if (date === selectedCalendarDate) {
            dayButton.classList.add("selected");
        }

        dayButton.addEventListener("click", () => {
            selectedCalendarDate = date;
            renderCalendar();
            renderCalendarDetails(date);
        });

        daysContainer.appendChild(dayButton);
    }

    renderCalendarDetails(selectedCalendarDate);
}

function renderCalendarDetails(date) {
    const details = document.getElementById("calendar-details");
    if (!details) return;

    details.replaceChildren();

    const heading = document.createElement("h4");
    heading.textContent = `${date} の創作記録`;
    details.appendChild(heading);

    const dailyActivities = activities.filter(
        activity => activity.date === date
    );

    if (dailyActivities.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "この日の活動記録はまだないよ。";
        details.appendChild(empty);
        return;
    }

    const totalMinutes = dailyActivities.reduce(
        (total, activity) => total + activity.minutes, 0
    );

    const total = document.createElement("p");
    total.textContent =
        `合計：${formatActivityTime(totalMinutes)}`;
    details.appendChild(total);

    const list = document.createElement("ul");

    for (const activity of dailyActivities) {
        const item = document.createElement("li");
        item.textContent =
            `${activity.genre}：${formatActivityTime(activity.minutes)}` +
            (activity.memo ? `（${activity.memo}）` : "");
        list.appendChild(item);
    }

    details.appendChild(list);
}

function changeCalendarMonth(amount) {
    calendarMonth += amount;

    if (calendarMonth < 0) {
        calendarMonth = 11;
        calendarYear--;
    } else if (calendarMonth > 11) {
        calendarMonth = 0;
        calendarYear++;
    }

    // 移動先の月の1日を選択
    selectedCalendarDate =
        `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-01`;

    renderCalendar();
}

document.getElementById("calendar-prev").addEventListener(
    "click", () => changeCalendarMonth(-1)
);

document.getElementById("calendar-next").addEventListener(
    "click", () => changeCalendarMonth(1)
);

renderCalendar();

/* ===== メニューの切り替え ===== */

function showPage(pageName) {
    // 右側の機能を表示・非表示にする
    document.querySelectorAll(".main-content [data-page]").forEach(element => {
        element.hidden = element.dataset.page !== pageName;
    });

    // 選択中のメニューを見た目で示す
    document.querySelectorAll(".menu-button").forEach(button => {
        const isActive = button.dataset.page === pageName;

        button.classList.toggle("active", isActive);
        button.setAttribute(
            "aria-current",
            isActive ? "page" : "false"
        );
    });
}

// メニューを押したとき
document.querySelectorAll(".menu-button").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

// 最初はホームを表示
showPage("home");
