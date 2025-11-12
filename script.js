/**
 * Setup: 獲取元素和定義常數
 */
const spinButton = document.getElementById('spinButton'); 
// 移除 resetButton 的引用，因為按鈕已經整合
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
let indexes = [0, 0, 0]; 
let isResetMode = false; // 新增：按鈕狀態追蹤

// 預先計算累計權重
const cumulativeWeights = [];
let currentSum = 0;
for (let i = 0; i < num_icons; i++) {
    currentSum += iconWeights[i];
    cumulativeWeights.push(currentSum);
}
const totalWeight = currentSum; 

// --- 按鈕狀態切換函式 ---
function setButtonToResetMode() {
    isResetMode = true;
    if (spinButton) {
        spinButton.disabled = false;
        // 【修正點】：變更標籤為「RESET」
        spinButton.textContent = 'RESET'; 
        spinButton.classList.add('reset-mode'); 
    }
}

function setButtonToSpinMode() {
    isResetMode = false;
    if (spinButton) {
        spinButton.textContent = 'START';
        spinButton.classList.remove('reset-mode');
        spinButton.disabled = false;
    }
    // 初始/歸零訊息
    if (messageElement) {
        messageElement.innerHTML = '按下「START」開始挑戰！';
    }
    // 歸零轉盤位置
    reelsList.forEach(reel => {
        reel.style.transition = `none`; 
        reel.style.backgroundPositionY = `0px`; 
    });
    // 重設狀態和索引
    slotMachineContainer.classList.remove('win1', 'win2', 'win3');
    reelsList.forEach(reel => reel.classList.remove('highlight-reel')); 
    indexes = [0, 0, 0];
}
// ----------------------


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
     
    // 1. 清除舊的樣式
    slotMachineContainer.classList.remove('win1', 'win2', 'win3');
    reelsList.forEach(reel => reel.classList.remove('highlight-reel')); 

    // 旋轉中訊息
    if (messageElement) messageElement.innerHTML = '轉盤中...祝你好運！';

	
	Promise
		
		.all( [...reelsList].map((reel, i) => roll(reel, i)) )	
		
		.then((finalIndexes) => {
			const currentIndexes = finalIndexes; 
                const iconNames = currentIndexes.map(i => iconMap[i]); 
			
                // --- 【中獎判斷邏輯】 ---
                const isTriple = currentIndexes[0] === currentIndexes[1] && currentIndexes[1] === currentIndexes[2];
                const isDouble = currentIndexes[0] === currentIndexes[1] || currentIndexes[1] === currentIndexes[2] || currentIndexes[0] === currentIndexes[2]; 

                let isWin = false; 
                // 未中獎時的訊息
                let messageHTML = `很可惜！再接再厲！`; 
                let winCls = "";
                
                if (isTriple) {
                    isWin = true;
                    
                    const isSevenTriple = currentIndexes[0] === 1; 
                    const tripleIconName = iconNames[0];
                    const resultLine = `三連 ${tripleIconName}-${tripleIconName}-${tripleIconName}`; 

                    if (isSevenTriple) {
                        messageHTML = `恭喜！👑 頭獎<br>(${resultLine})`;
                        winCls = "win3"; 
                    } else {
                        messageHTML = `恭喜！🎉 大獎<br>(${resultLine})`;
                        winCls = "win2"; 
                    }
                } else if (isDouble) {
                     isWin = true;
                     // 兩連訊息簡化，無 detail-text
                     messageHTML = `恭喜！🌟 小獎`;
                     winCls = "win1";
                }
                // --- 【中獎判斷邏輯結束】 ---
                
                if (messageElement) messageElement.innerHTML = messageHTML;
                
                // 處理按鈕切換
                if (isWin) {
				// 容器閃爍 
				if (slotMachineContainer) slotMachineContainer.classList.add(winCls);
                    
				setTimeout(() => {
                        if (slotMachineContainer) slotMachineContainer.classList.remove(winCls);
                        // 轉為歸零模式
                        setButtonToResetMode();
                    }, 4000); 
			} else {
                    // 未中獎，顯示訊息後，轉為歸零模式
                    const buttonDelay = 1000;
                    setTimeout(() => {
                        setButtonToResetMode();
                    }, buttonDelay);
                }
		
                // 更新 indexes
                indexes.splice(0, indexes.length, ...finalIndexes);

		});
};


// 【連接事件和初始化】
document.addEventListener('DOMContentLoaded', () => {
    
    // 【修正點】：設定網頁 TAB 標籤名稱 (Title)
    document.title = "MKCR Lucky 7"; 
    
    // 主按鈕處理邏輯：根據模式執行 SPIN 或 RESET
    if (spinButton) {
        spinButton.addEventListener('click', () => {
            if (isResetMode) {
                setButtonToSpinMode(); // 執行歸零，並切換回 START 模式
            } else {
                rollAll(); // 執行 SPIN
            }
        });
    }
    
    // 初始化為 START 模式
    setButtonToSpinMode(); 
});