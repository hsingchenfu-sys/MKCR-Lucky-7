/**
 * Setup: 獲取元素和定義常數
 */
const spinButton = document.getElementById('spinButton'); 
const resetButton = document.getElementById('resetButton'); 
const messageElement = document.getElementById('message');
const slotMachineContainer = document.querySelector('.slot-machine') || document.body; 
const reelsList = document.querySelectorAll('.slots > .reel'); 

// 【9 個圖案】
const iconMap = ["banana", "seven", "cherry", "plum", "orange", "bell", "bar", "lemon", "melon"];

// 加權配置 (總和為 100)
const iconWeights = [
    5,  // banana (0) - 低機率
    5,  // seven (1)  - 保持稀有性
    10, // cherry (2) - 普通
    5,  // plum (3)   - 低機率
    20, // orange (4) - 高機率
    20, // bell (5)   - 高機率
    15, // bar (6)    - 高機率
    15, // lemon (7)  - 高機率
    5   // melon (8)  - 低機率
];

// 【關鍵尺寸設定 - 必須與 CSS 匹配】
const icon_width = 80;	
const icon_height = 80;	
const num_icons = 9;	
const time_per_icon = 100;
const indexes = [0, 0, 0]; 

// 預先計算累計權重
const cumulativeWeights = [];
let currentSum = 0;
for (let i = 0; i < num_icons; i++) {
    currentSum += iconWeights[i];
    cumulativeWeights.push(currentSum);
}
const totalWeight = currentSum; 


/**	
 * 加權隨機選擇一個圖案索引
 */
function weightedRandomIndex() {
    const r = Math.random() * totalWeight; 
    for (let i = 0; i < num_icons; i++) { 
        if (r < cumulativeWeights[i]) {
            return i;
        }
    }
    return Math.floor(Math.random() * num_icons);
}


/**	
 * Roll one reel 
 */
const roll = (reel, offset = 0) => {
    
    const finalIconIndex = weightedRandomIndex();
    
    const minRevolutions = (offset + 2) * num_icons; 
    const randomRevolutions = Math.round(Math.random() * num_icons);
    
    const programTargetIndex = (indexes[offset] + minRevolutions + randomRevolutions) % num_icons;
    
    // 修正：最終圖案位置在捲軸上的視覺位置 (例如：我們希望看到第三個圖案)
    const correctedTargetIndex = (finalIconIndex - 1 + num_icons) % num_icons; 
    
    let deltaNew = (correctedTargetIndex - programTargetIndex + num_icons) % num_icons;
    
    const delta = deltaNew + minRevolutions + randomRevolutions;


	return new Promise((resolve, reject) => {
		
		const style = getComputedStyle(reel),
					backgroundPositionY = parseFloat(style["background-position-y"]),
					targetBackgroundPositionY = backgroundPositionY + delta * icon_height, 
					normTargetBackgroundPositionY = targetBackgroundPositionY%(num_icons * icon_height); 
		
		setTimeout(() => { 
			reel.style.transition = `background-position-y ${(8 + 1 * delta) * time_per_icon}ms cubic-bezier(.41,-0.01,.63,1.09)`;
			reel.style.backgroundPositionY = `${targetBackgroundPositionY}px`; 
		}, offset * 150);
			
		setTimeout(() => {
			reel.style.transition = `none`;
			resolve(finalIconIndex); 
		}, (8 + 1 * delta) * time_per_icon + offset * 150);
        
        // 關鍵對齊修正：確保最終位置是正確圖案的中心
        setTimeout(() => {
            reel.style.backgroundPositionY = `${normTargetBackgroundPositionY + icon_height}px`;
        }, (8 + 1 * delta) * time_per_icon + offset * 150);
		
	});
};


/**
 * Roll all reels 
 */
function rollAll() {
    
    if (spinButton) spinButton.disabled = true;
    if (resetButton) resetButton.disabled = true; // 禁用歸零按鈕

    // 1. 清除舊的樣式
    slotMachineContainer.classList.remove('win1', 'win2', 'win3');
    reelsList.forEach(reel => reel.classList.remove('highlight-reel')); 

    if (messageElement) messageElement.innerHTML = '旋轉中...祝您好運！';

	
	Promise
		
		.all( [...reelsList].map((reel, i) => roll(reel, i)) )	
		
		.then((finalIndexes) => {
			const currentIndexes = finalIndexes; 
            
            const iconNames = currentIndexes.map(i => iconMap[i]); 
			
            // --- 【中獎判斷邏輯 - 修正：恢復兩連，簡化文字】 ---
            const isTriple = currentIndexes[0] === currentIndexes[1] && currentIndexes[1] === currentIndexes[2];
            // 恢復兩連判斷
            const isDouble = currentIndexes[0] === currentIndexes[1] || currentIndexes[1] === currentIndexes[2] || currentIndexes[0] === currentIndexes[2]; 

            let isWin = false; 
            let messageHTML = `很可惜，請再試一次！`; 
            let winCls = "";
            
            if (isTriple) {
                isWin = true;
                
                const isSevenTriple = currentIndexes[0] === 1; 
                const tripleIconName = iconNames[0];
                const resultLine = `三連 ${tripleIconName}-${tripleIconName}-${tripleIconName}`;

                if (isSevenTriple) {
                    messageHTML = `恭喜！👑 頭獎<br><span class="detail-text">(${resultLine})</span>`;
                    winCls = "win3"; 
                } else {
                    messageHTML = `恭喜！🎉 大獎<br><span class="detail-text">(${resultLine})</span>`;
                    winCls = "win2"; 
                }
            } else if (isDouble) {
                 isWin = true;
                 // 【關鍵修正】：移除詳細的圖案名稱，只顯示中獎等級
                 messageHTML = `恭喜！🌟 小獎`;
                 winCls = "win1";
            }
            // --- 【中獎判斷邏輯結束】 ---
            
            if (messageElement) messageElement.innerHTML = messageHTML;
            
            if (isWin) {
				// 容器閃爍 
				if (slotMachineContainer) slotMachineContainer.classList.add(winCls);
                
				setTimeout(() => {
                    if (slotMachineContainer) slotMachineContainer.classList.remove(winCls);
                }, 4000); 
			}
		
            const buttonDelay = isWin ? 4000 : 1000;
            setTimeout(() => {
                if (spinButton) spinButton.disabled = false;
                if (resetButton) resetButton.disabled = false; // 啟用歸零按鈕
            }, buttonDelay);
            
            // 更新 indexes (供下次轉動參考)
            indexes.splice(0, indexes.length, ...finalIndexes);

		});
};

/**
 * 將所有轉盤歸零 (第一個圖案)
 */
function resetAll() {
    if (spinButton) spinButton.disabled = true; // 歸零時禁用 SPIN 按鈕

    reelsList.forEach(reel => {
        // 確保轉盤沒有過渡效果
        reel.style.transition = `none`; 
        
        // 設置背景位置為 0px，即第一個圖案的位置
        reel.style.backgroundPositionY = `0px`; 
    });

    // 重設狀態和訊息
    slotMachineContainer.classList.remove('win1', 'win2', 'win3');
    reelsList.forEach(reel => reel.classList.remove('highlight-reel')); 
    
    if (messageElement) messageElement.innerHTML = '已歸零。按下「START」開始遊戲！';

    // 重設索引
    indexes.splice(0, indexes.length, 0, 0, 0); 
    
    // 稍後重新啟用 SPIN 按鈕
    setTimeout(() => {
        if (spinButton) spinButton.disabled = false; 
    }, 500); // 短暫延遲，讓使用者看到歸零效果
}


// 【連接事件和初始化】
document.addEventListener('DOMContentLoaded', () => {
    
    if (spinButton) {
        spinButton.addEventListener('click', rollAll);
    }
    
    // 連接歸零按鈕事件
    if (resetButton) {
        resetButton.addEventListener('click', resetAll);
    }
    
    // 初始化時將轉盤位置設為 0px
    reelsList.forEach(reel => {
        reel.style.backgroundPositionY = `0px`; 
    });
    
    if (messageElement) {
        messageElement.innerHTML = '按下「START」開始遊戲！';
    }
});