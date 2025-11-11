// 可用的符號
const symbols = ['🍒', '🍋', '🍇', '🍉', '🔔', '⭐', '7️⃣'];

// 獲取 HTML 元素
const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
];
const spinButton = document.getElementById('spinButton');
const messageElement = document.getElementById('message');

// 隨機選擇一個符號
function getRandomSymbol() {
    const randomIndex = Math.floor(Math.random() * symbols.length);
    return symbols[randomIndex];
}

// 旋轉一個輪子，顯示動畫效果
function spinReel(reel) {
    return new Promise(resolve => {
        const duration = 1500; // 動畫持續時間 (毫秒)
        const startTime = Date.now();
        let intervalCount = 0;

        // 設定一個短時間的間隔，快速切換符號
        const interval = setInterval(() => {
            reel.textContent = getRandomSymbol();
            intervalCount++;

            // 動畫結束條件
            if (Date.now() - startTime >= duration) {
                clearInterval(interval);
                // 最終結果：隨機選一個並停止
                const finalSymbol = getRandomSymbol();
                reel.textContent = finalSymbol;
                resolve(finalSymbol); // 完成 Promise，返回最終符號
            }
        }, 100); // 每 100 毫秒切換一次符號
    });
}

// 檢查結果
function checkWin(results) {
    const firstSymbol = results[0];
    // 檢查所有符號是否都相同
    if (results.every(symbol => symbol === firstSymbol)) {
        return true;
    }
    return false;
}

// 處理按鈕點擊事件
spinButton.addEventListener('click', async () => {
    // 1. 禁用按鈕並清空訊息
    spinButton.disabled = true;
    messageElement.textContent = '旋轉中...祝您好運！';
    messageElement.style.color = '#333';

    // 2. 同時旋轉所有輪子，並等待它們全部完成
    const reelPromises = [spinReel(reels[0]), spinReel(reels[1]), spinReel(reels[2])];
    const results = await Promise.all(reelPromises); // results 陣列包含三個輪子的最終符號

    // 3. 檢查結果
    const isWin = checkWin(results);

    // 4. 顯示結果訊息
    if (isWin) {
        messageElement.textContent = `恭喜！🎉 您贏了！${results[0]}${results[1]}${results[2]}`;
        messageElement.style.color = 'red';
    } else {
        messageElement.textContent = `很可惜，請再試一次！${results[0]}${results[1]}${results[2]}`;
        messageElement.style.color = '#333';
    }

    // 5. 重新啟用按鈕
    spinButton.disabled = false;
});