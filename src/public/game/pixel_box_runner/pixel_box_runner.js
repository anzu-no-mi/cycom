(() => {
    //===========================================================
    // 変数 / 状態管理
    //===========================================================
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    let gameState = "title"; // "title", "countdown", "playing", "result", "finished", "gameover"

    // 画面 DOM
    const titleScreen = document.getElementById("titleScreen");
    const gameScreen  = document.getElementById("gameScreen");
    const resultScreen = document.getElementById("resultScreen");
    const gameOverScreen = document.getElementById("gameOverScreen");

    // HUD DOM
    const hud      = document.getElementById("hud");
    const elScore = document.getElementById('hudScore');
    const elTime = document.getElementById('hudTime');

    // Result DOM
    const resultScore  = document.getElementById("resultScore");
    const resultTime   = document.getElementById("resultTime");
    const resultItemDetail = document.getElementById("resultItemDetail");
    const resultEnemyDetail = document.getElementById("resultEnemyDetail");
    // ゴール演出完了フラグ
    let finishedEffectEnded = false;
    // カウントダウン表示用（null: 表示なし / 0..3: 表示中）
    let countdown = null;

    // 画面ボタン DOM
    const startBtn = document.getElementById('startBtn');
    const backToTitleBtn = document.getElementById('backToTitleBtn');
    const gameOverToTitleBtn = document.getElementById('gameOverToTitleBtn');

    // ===== ゲームパラメータ =====
    const LEVEL_WIDTH = 4000;
    const GRAVITY = 0.8;
    const TIME_LIMIT = 120;

    // ===== ステージ構成 =====
    const platforms = [
        {x:0,y:380,w:LEVEL_WIDTH,h:70}, // 地面
        {x:300,y:310,w:200,h:16,depth:0}, // 足場群(スタート位置に一番近い)
        {x:650,y:260,w:200,h:16,depth:0}, 
        {x:1050,y:320,w:180,h:16,depth:0},
        {x:1400,y:270,w:250,h:16,depth:0},
        {x:1850,y:340,w:160,h:16,depth:0},
        {x:2250,y:300,w:220,h:16,depth:0},
        {x:2700,y:250,w:200,h:16,depth:0},
        {x:3050,y:320,w:180,h:16,depth:0},
        {x:3450,y:300,w:100,h:16,depth:0} // 足場群(ゴール位置に一番近い)
    ];

    // ===== プレイヤー =====
    const player = {
        x:80, y:300, w:34, h:48,
        vx:0, vy:0,
        onGround:false,
        crouch:false,
        invincibleUntil:0,
        z:0,
        facing:'right'  // 初期は右向き
    };

    // ===== 敵・アイテム・ゴール =====
    let enemies = [];
    const ENEMY_COLORS = {
        1: '#3A86FF',
        2: '#FFBE0B',
        3: '#8338EC'
    }
    const ENEMY_DAMAGE = {
        1: 1,
        2: 2,
        3: 3
    };
    let items = [];
    const ITEM_COLORS = {
        1: '#00F5D4',
        2: '#F15BB5',
        3: '#FFD60A'
    }
    const ITEM_SCORE = {
        1: 1,
        2: 3,
        3: 5
    };
    const goal = {x:3800,y:50,w:80,h:330, reached:false, anim:0 };

    // ===== ゲーム状態変数 =====
    let score = 0;
    let startTime = null;
    let elapsed = 0;
    let playing = false;
    let finished = false;
    let cameraX = 0;

    //=========================================================
    // 入力管理(キー設定)
    //=========================================================
    // キーセット定義 （input: イベント.code / label: 表示用ラベル）
    const keySets = {
        numpad: {
            input: {
                left: 'Numpad4',
                right: 'Numpad6',
                jump: 'Space',
                crouch: 'KeyC'
            },
            label: {
                left: '4',
                right: '6',
                jump: 'SPACE',
                crouch: 'c'
            }
        },
        arrow: {
            input: {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                jump: 'Space',
                crouch: 'KeyC'
            },
            label: {
                left: '←',
                right: '→',
                jump: 'SPACE',
                crouch: 'c'
            }
        },
        wasd: {
            input: {
                left: 'KeyA',
                right: 'KeyD',
                jump: 'Space',
                crouch: 'KeyS'
            },
            label: {
                left: 'a',
                right: 'd',
                jump: 'SPACE',
                crouch: 's'
            }
        }
    };
    // デフォルトのキーセットを numpad に設定
    let currentKeySet = keySets.numpad;
    // localStorage を確認
    const saved = localStorage.getItem('keyset');
    if (saved && keySets[saved]) {
        // 保存されているキーセットがあれば適用
        currentKeySet = keySets[saved];
        document.querySelector(
            `#keyConfig input[value="${saved}"]`
        ).checked = true;
    }
    // 初期表示
    updateHowToPlay(currentKeySet);
    cloneHowToPlay();

    // ラジオボタン変更時
    document.querySelectorAll('#keyConfig input[name="keyset"]').forEach(radio => {
        radio.addEventListener('change', e => {
            if (gameState === 'playing') { // プレイ中は変更不可
                e.preventDefault();
                return;
            }
            const value = e.target.value;
            currentKeySet = keySets[value];
            localStorage.setItem('keyset', value);
            updateHowToPlay(currentKeySet); // 表示更新
        });
    });

    // ===== 表示更新関数 =====
    function updateHowToPlay(keySet) {
        document.querySelectorAll('.keysStyle').forEach(el => {
            const action = el.dataset.action; // left / right / jump / crouch
            if (keySet.label[action]) {
                el.textContent = keySet.label[action];
            }
        });
    }
    // ===== キー設定有効/無効化関数 =====
    function setKeyConfigEnabled(enabled) {
        document.querySelectorAll('#keyConfig input[name="keyset"]').forEach(radio => {
            radio.disabled = !enabled; // 有効/無効化

            // ラベルのスタイル更新
            const label = radio.closest('label');
            if (!label) return; // ラベルが見つからない場合はスキップ
            if (!enabled && !radio.checked) {
                // 無効 ＆ 未選択 → class 付与
                label.classList.add('keyConfigDisabled');
            } else {
                // 有効化 or 選択中 → class 除去
                label.classList.remove('keyConfigDisabled');
            }
        });

    }
    // ===== 「遊び方」複製関数 =====
    function cloneHowToPlay() {
        const original = document.getElementById('howToPlay');
        if (!original) return;

        // すでに複製済みなら何もしない（多重生成防止）
        if (document.getElementById('howToPlayClone')) return;

        const clone = original.cloneNode(true);

        // id 重複回避
        clone.id = 'howToPlayClone';
        // クラス追加
        clone.classList.add('howToPlay');

        // keyConfig の兄弟として追加
        const keyConfig = document.getElementById('keyConfig');
        keyConfig.parentNode.appendChild(clone);
    }

    //=========================================================
    // 入力管理(ゲームプレイ中)
    //=========================================================
    // キーボード入力管理
    const keys = {
        left: false,
        right: false,
        jump: false,
        crouch: false
    };
    let jumpPressed = false;
    window.addEventListener('keydown', e => {
        // Space のデフォルト挙動（ページスクロール）抑止
        if (e.code === 'Space') e.preventDefault();

        // 左
        if (e.code === currentKeySet.input.left)  keys.left = true;
        // 右
        if (e.code === currentKeySet.input.right) keys.right = true;

        // ジャンプ・しゃがみ
        if (e.code === currentKeySet.input.jump)   keys.jump = true;
        if (e.code === currentKeySet.input.crouch) keys.crouch = true;
        // デバッグ用
        console.log('keydown:', e.code, keys);
    });
    window.addEventListener('keyup', e => {
        if (e.code === currentKeySet.input.left)  keys.left = false;
        if (e.code === currentKeySet.input.right) keys.right = false;
        if (e.code === currentKeySet.input.jump) { keys.jump = false; jumpPressed = false; } // ← 着地後に再ジャンプ可能にする
        if (e.code === currentKeySet.input.crouch) keys.crouch = false;
        // デバッグ用
        // console.log('keyup:', e.code, keys);
    });

    // ===== ゲームロジック =====
    // 矩形当たり判定
    function rectIntersect(a,b){ return !(a.x+a.w<b.x||a.x>b.x+b.w||a.y+a.h<b.y||a.y>b.y+b.h); }
    // 値の範囲制限
    function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

    // 敵・アイテム生成
    function generateEntities(){
        enemies = [];
        items = [];

        // 日本時間の日付を seed にする
        const dateSeed = getJSTDateString(); // 例: "2026-01-18"
        const rand = createSeededRandom(dateSeed);

        // 敵生成
        const enemyCount = 7;
        for(let i=0;i<enemyCount;i++){
            let p = platforms[1 + Math.floor(rand()*(platforms.length-1))];
            const type = 1 + Math.floor(rand()*3);
            const speed = [1.2,0.9,1.6][type-1];
            const damage = ENEMY_DAMAGE[type];
            const w = 32, h = 32;
            const x = clamp(p.x + 10 + rand()*(p.w - w - 20), p.x+10, p.x+p.w-w-10);
            const y = p.y - h;
            const margin = 40;
            const ax = Math.max(p.x, x - margin);
            const bx = Math.min(p.x + p.w - w, x + margin);
            enemies.push({category: "enemy",x,y,w,h,ax,bx,v:speed,damage,type});
        }

        // アイテム生成
        const itemCount = 9;
        for(let i=0;i<itemCount;i++){
            let p = platforms[1 + Math.floor(rand()*(platforms.length-1))];
            const type = 1 + Math.floor(rand()*3);
            const value = ITEM_SCORE[type];
            const x = clamp(p.x + 10 + rand()*(p.w - 20), p.x+10, p.x+p.w-10);
            const y = p.y - 18 - rand()*30;
            items.push({category: "item",x,y,collected:false,value,type});
        }
    }

    //===========================================================
    // メイン更新処理
    //===========================================================
    function update(dt){
        if(playing && !finished){
            if (gameState !== "playing") return;   // プレイ時以外は update しない
            elapsed = (performance.now() - startTime) / 1000;

            // 保存しておく：前フレームの位置（垂直も保存しておく）
            const prevX = player.x;
            const prevY = player.y;

            // キー入力取得
            const left = keys.left;
            const right = keys.right;
            const jump = keys.jump;
            const crouch = keys.crouch;
            player.crouch = crouch;

            // しゃがみ中は左右入力を無視する（移動不可にする）
            const doMoveLeft = crouch ? false : left;
            const doMoveRight = crouch ? false : right;

            // =====================
            // 🔹 移動制御
            // =====================
            let moveInput = 0;
            if (doMoveLeft) moveInput -= 1;
            if (doMoveRight) moveInput += 1;

            // --- 加速設定 ---
            let accel;
            if (player.onGround) {
                accel = 0.55; // 地上は少し強め
            } else {
                // 空中では慣性を残す（上昇・下降で差をつける）
                if (player.vy < -0.5) {
                    accel = 0.12; // 上昇中（ふわっと）
                } else if (player.vy > 1.0) {
                    accel = 0.20; // 明確な下降中（やや重め）
                } else {
                    accel = 0.16; // 頂点付近
                }
            }

            // --- 移動処理 ---
            if (moveInput !== 0) {
                player.vx += moveInput * accel;
            } else if (player.onGround) {
                // 摩擦適用（地上で入力がないときだけ）
                player.vx *= 0.8;
            } else {
                // 空中では慣性を残す（上昇・下降で差をつける）
                if (player.vy < 0) {
                    player.vx *= 0.98; // 上昇中ふわっと
                } else {
                    player.vx *= 0.95; // 下降中は減速しやすく
                }
            }

            // --- 最高速度 ---
            let maxSpeed;
            if (player.onGround) {
                maxSpeed = 3.6;
            } else {
                if (player.vy < -0.5) {
                    maxSpeed = 2.4; // 上昇中（遅め）
                } else if (player.vy > 1.0) {
                    maxSpeed = 2.8; // 下降中（やや速め）
                } else {
                    maxSpeed = 2.6; // 頂点付近
                }
            }
            if (player.vx > maxSpeed) player.vx = maxSpeed;
            if (player.vx < -maxSpeed) player.vx = -maxSpeed;

            // --- 向き更新 ---
            if (player.vx > 0.1) player.facing = 'right';
            else if (player.vx < -0.1) player.facing = 'left';

            //=============================
            // 🔹 重力カーブ重力カーブ＋短押し対応＋頂点滞空
            //=============================
            // 通常の基礎重力
            const BASE_GRAVITY = 0.6;
            let gravity = BASE_GRAVITY;

            // --- 状態別の重力調整 ---
            if (player.vy < -1.5) {
                gravity *= 0.6; // 上昇中：軽く
            } else if (player.vy > 1.5) {
                gravity *= 1.4; // 下降中：重く
            } else {
                gravity *= 0.3; // 頂点付近：ふわっと浮かせる（滞空感）
            }

            // --- Easing補正 ---
            // vy が 0（頂点）に近づくほど重力を滑らかに弱める
            const easeFactor = 1 - Math.min(Math.abs(player.vy) / 6, 1);  // 0～1
            gravity *= (1 - 0.4 * easeFactor); // 頂点では最大40%軽く

            // --- 短押しジャンプ対応（上昇中に離したら慣性カット） ---
            if (!jump && player.vy < 0) {
            player.vy *= 0.6; // 上昇慣性を減らす（マリオの短押し風）
            }
            // --- 重力適用 ---
            player.vy += gravity;

            //==========================
            // 🔹 横移動
            //==========================
            player.x += player.vx;
            // 横方向の衝突チェック
            for (let p of platforms) {
                // depth が未定義なら 0 扱い
                const pDepth = (typeof p.depth !== 'undefined') ? p.depth : 0;
                if (pDepth < player.z) continue; // プラットフォームが奥にある -> 無視

                // まず矩形重なり判定
                if (!rectIntersect(
                    {x:player.x, y:player.y, w:player.w, h:player.h},
                    {x:p.x, y:p.y, w:p.w, h:p.h}
                )) continue; // 衝突していなければ次へ

                // --- 判定補正：プラットフォームがプレイヤーの背丈より下にある場合は衝突を無視 ---
                // このチェックで「見た目の手前を通過しているだけ」なら jump を妨げない
                const platformTop = p.y;
                const platformBottom = p.y + p.h;
                const playerTop = player.y;
                const playerBottom = player.y + player.h;
                console.log('platforms[0]:', platforms[0], 'playerTop:', playerTop, 'playerBottom:', playerBottom);
                if (playerBottom == platforms[0].y && platformBottom >= playerTop) {
                    // 地面に近いプラットフォームの特別処理
                    // プレイヤーが地面に居る、かつプラットフォームの下部がプレイヤーの背丈より下にある場合 → 衝突を無視（通過できる）
                    continue;
                } else if ((platformTop >= playerBottom) || (platformBottom <= playerTop)) {
                    // プラットフォームがプレイヤーの足元より下か、背丈より上にある → 衝突を無視（通過できる）
                    continue;
                }

                // --- 縦方向に上から着地しそうなら、横衝突は無視 ---
                // 下降中かつ、前フレームで足元がプラットフォームより上にあった場合
                if (player.vy > 0 && (prevY + player.h) <= platformTop + 6) {
                    player.x = prevX; // 位置を元に戻す（=横衝突で押し戻されないようにする）
                    continue;
                }

                // --- 横からの衝突処理 ---
                if (player.onGround) {
                    if (player.vx > 0 && prevX + player.w <= p.x) { // 前フレームではプラットフォームの左側にいた場合
                        player.x = p.x - player.w; // 右方向からぶつかったと判断し、player.x をプラットフォームの左端に合わせる
                    } else if (player.vx < 0 && prevX >= p.x + p.w) { // 前フレームではプラットフォームの右側にいた場合
                        player.x = p.x + p.w; // 左方向からぶつかったと判断し、player.x をプラットフォームの右端に合わせる
                    }
                    player.vx = 0; // 横速度をゼロにする
                } else {
                    // 空中で横から接触した場合は「側面に貼り付かない」ようにする。
                    // 位置を元に戻して、横速度はゼロにしない（そのまま落ちる）。
                    player.x = prevX;
                    // option: slightly reduce horizontal speed to avoid immediate re-collision:
                    player.vx *= 0.6; // 少しだけ減衰させる（再衝突を防ぐ）
                }
            }

            //==========================
            // 🔹 縦移動
            //==========================
            player.y += player.vy;
            player.onGround = false;
            for(let p of platforms){
                // depth が未定義なら 0 扱い
                const pDepth = (typeof p.depth !== 'undefined') ? p.depth : 0;

                if (pDepth < player.z) continue; // プラットフォームが奥にある -> 無視

                // まず矩形重なり判定
                if(!rectIntersect(
                    {x:player.x,y:player.y,w:player.w,h:player.h},
                    {x:p.x,y:p.y,w:p.w,h:p.h}
                )) continue; // 衝突していなければ次へ

                const platformTop = p.y;
                const platformBottom = p.y + p.h;
                const playerTop = player.y;
                const playerBottom = player.y + player.h;
                if(player.vy > 0 && (prevY + player.h) <= platformTop + 6){ // +6 はマージン（緩和）
                    // --- 縦方向に上から着地しそうな場合 ---
                    // 下降中かつ、前フレームで足元がプラットフォームより上にあった場合
                    player.y = platformTop - player.h; // プレイヤーを床の上に置く（浅い貫通を修正）
                    player.vy = 0; // 垂直速度を止める（着地）
                    player.onGround = true;
                    // 重要：着地した時点でジャンプ押下状態を確認し、
                    // 押されていなければジャンプロックを解除して再ジャンプ可能にする
                    if (!jump) {
                        jumpPressed = false;
                    }
                    break; // このプラットフォームで処理が終わればループを抜ける（最初の着地を優先）
                } else if(player.vy < 0 && (prevY) >= platformBottom - 1){
                    // --- 上昇中に天井に当たった場合 ---
                    player.y = platformBottom; // プレイヤーをプラットフォーム下に押し戻す
                    player.vy = 0;
                    break;
                } else {
                    // --- 横から衝突した場合（側面衝突や深い貫通など） ---

                    console.log('platforms[0]:', platforms[0], 'playerTop:', playerTop, 'playerBottom:', playerBottom, 'platformBottom:', platformBottom);
                    if (platformTop >= playerTop) {
                        // 地面に近いプラットフォームの特別処理
                        // プレイヤーが地面に居る、かつプラットフォームの上部がプレイヤーの背丈より下にある場合 → 衝突を無視（通過できる）
                        player.onGround = true;
                        // 重要：着地した時点でジャンプ押下状態を確認し、
                        // 押されていなければジャンプロックを解除して再ジャンプ可能にする
                        if (!jump) {
                            jumpPressed = false;
                        }
                        break;
                    }
                    player.y = prevY; // 垂直位置を前フレームに戻す（不自然なめり込みを解消）
                    player.vy = 0;
                    break;
                }
            }

            //==========================
            // 🔹 ジャンプ処理
            //==========================
            if(jump && player.onGround && !jumpPressed){
                player.vy = -14; // 上向きに強い初速を与える（負が上方向）
                player.onGround = false;
                jumpPressed = true;
            }

            //==========================
            // 🔹 境界・落下・スコアなど
            //==========================
            player.x = clamp(player.x, 0, LEVEL_WIDTH - player.w);
            player.y = Math.min(player.y, H + 600);

            // 落下処理
            if(player.y > H + 400){
                // 画面下に大きく落ちたら位置・速度をリセットしスコア減少
                player.x = 80;
                player.y = 300;
                player.vx = 0;
                player.vy = 0;
                score = Math.max(0, score - 1);
            }

            //==========================
            // 🔹 敵・アイテム・ゴール判定
            //==========================
            // --- 敵の移動更新 ---
            for(let e of enemies){ e.x += e.v; if(e.x < e.ax){ e.x=e.ax; e.v*=-1 } if(e.x>e.bx){ e.x=e.bx; e.v*=-1 } }

            // --- 敵当たり判定（プレイヤーと敵） ---
            const now = performance.now();
            for(let e of enemies){
                const en = {x:e.x,y:e.y,w:e.w,h:e.h};
                const pl = {x:player.x,y:player.y,w:player.w,h:player.h};
                if(rectIntersect(en,pl)){
                    if(now > player.invincibleUntil){
                        score = Math.max(0, score - e.damage); // スコア減少
                        e.hit = (e.hit || 0) + 1; // ヒット回数をカウント
                        player.invincibleUntil = now + 1000; // 1秒間無敵
                        player.damageFlashUntil = now + 400; // 🔸0.4秒間 赤く点滅
                        player.vx = 0; // ノックバック無し：吹っ飛び挙動無し
                        player.vy = 0; // ノックバック無し：吹っ飛び挙動無し
                    }
                }
            }

            // --- アイテム当たり判定 ---
            for(let it of items){
                if(!it.collected){ // 未取得の場合のみ判定
                    const box = {x:it.x-12,y:it.y-12,w:24,h:24}; // アイテムの当たり判定
                    const pl = {x:player.x,y:player.y,w:player.w,h:player.h};
                    if(rectIntersect(box,pl)){
                        it.collected = true; // 取得済みにする
                        score += it.value; // スコア加算
                    }
                }
            }

            // --- カメラ位置更新 ---
            cameraX = clamp(player.x - W*0.35, 0, LEVEL_WIDTH - W);

            // --- ゴール判定 ---
            const goalBox = {x:goal.x,y:goal.y,w:goal.w,h:goal.h};
            const plbox = {x:player.x,y:player.y,w:player.w,h:player.h};
            if(rectIntersect(goalBox,plbox) && !goal.reached){
                goal.reached = true;
                goal.anim = 1.0;
                playing = false;
                finished = true;
                const timeRemaining = Math.max(0, Math.ceil(TIME_LIMIT - elapsed));
                score += timeRemaining;
                // 花火を作る
                spawnGoalParticles(goal.x + goal.w/2, goal.y + 40);

                setTimeout(() => {
                    finishedEffectEnded = true;
                }, 1500); // 1.5秒後に結果画面表示
            }

            // --- タイムアップ判定 ---
            if(elapsed >= TIME_LIMIT){
                finished = true;
                playing = false;
            }

            // --- スコア・時間表示更新 ---
            elScore.textContent = `Score: ${score}`;
            elTime.textContent = `Time: ${Math.max(0, Math.floor(TIME_LIMIT - elapsed))}s`;
        }
    }

    //===========================================================
    // パーティクル管理（colプロパティで統一）
    //===========================================================
    let particles = [];
    // ゴール到達時の花火パーティクル生成
    function spawnGoalParticles(x, y){
        const colors = ['#ffea00','#00ffcc','#ff66cc','#ff8c00'];
        for(let i=0;i<40;i++){
            particles.push({
                x: x + (Math.random()-0.5)*20,
                y: y + (Math.random()-0.5)*20,
                vx: (Math.random()-0.5)*6,
                vy: (Math.random()-1.5)*-6,
                life: 50 + Math.random()*40,
                col: colors[Math.floor(Math.random()*colors.length)]
            });
        }
    }
    // パーティクル更新
    function updateParticles(){
        for(let i=particles.length-1;i>=0;i--){
            const p = particles[i];
            p.vy += 0.15;
            p.x += p.vx; p.y += p.vy; p.life -= 1;
            if(p.life <= 0) particles.splice(i,1);
        }
    }
    // パーティクル描画
    function drawParticles(ctx, cameraX){
        for(let p of particles){
            ctx.globalAlpha = Math.max(p.life / 80, 0);
            ctx.fillStyle = p.col;
            ctx.fillRect(p.x - cameraX, p.y, 4, 4);
        }
        ctx.globalAlpha = 1;
    }

    //===========================================================
    // 描画処理
    //===========================================================
    function draw(){
        ctx.clearRect(0,0,W,H); // 画面クリア

        // === 背景描画（パララックス） ===
        // 空のグラデーション
        const sky = ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#8fd3ff'); sky.addColorStop(1,'#6a9be6'); ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
        // 遠景の山
        ctx.fillStyle = '#2f6f3f';
        for(let i=0;i<8;i++){ const hx = (i*600) - (cameraX*0.15 % 600); ctx.beginPath(); ctx.ellipse(hx+120,360,320,90,0,0,Math.PI*2); ctx.fill(); }
        // 近景の山
        ctx.fillStyle = '#3d7d4d';
        for(let i=0;i<10;i++){ const hx = (i*500) - (cameraX*0.25 % 500); ctx.beginPath(); ctx.ellipse(hx+80,330,220,70,0,0,Math.PI*2); ctx.fill(); }
        // 足場
        ctx.fillStyle = '#5c4033'; for(let p of platforms){ ctx.fillRect(p.x - cameraX, p.y, p.w, p.h); }

        // ゴール
        // ctx.fillStyle = '#1db954'; ctx.fillRect(goal.x - cameraX, goal.y, goal.w, goal.h);
        ctx.fillStyle = '#fff'; ctx.fillRect(goal.x - cameraX, goal.y, 10, goal.h);

        // ゴールの旗
        const flagX = goal.x - cameraX + 10; const flagY = goal.y + 6;
        const sway = Math.sin(Date.now()/200) * 8 * (goal.reached ? 1 + goal.anim : 1);
        ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(flagX, flagY); ctx.lineTo(flagX + 60 + sway, flagY + 25); ctx.lineTo(flagX, flagY + 50); ctx.closePath(); ctx.fill();

        // アイテム描画
        for(let it of items){
            if(it.collected) continue;
            const x = it.x - cameraX, y = it.y;
            switch(it.type){
                case 1: ctx.fillStyle = ITEM_COLORS[1]; break;
                case 2: ctx.fillStyle = ITEM_COLORS[2]; break;
                case 3: ctx.fillStyle = ITEM_COLORS[3]; break;
            }
            ctx.beginPath();
            ctx.arc(x, y, 8 + it.value*1.5, 0, Math.PI*2);
            ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x-3, y-3, 6, 6);
        }

        // 敵描画
        for(let e of enemies){ 
            const x = e.x - cameraX, y = e.y;
            switch(e.type){
                case 1: ctx.fillStyle=ENEMY_COLORS[1]; break;
                case 2: ctx.fillStyle=ENEMY_COLORS[2]; break;
                case 3: ctx.fillStyle=ENEMY_COLORS[3]; break;
            }
            ctx.fillRect(x, y, e.w, e.h);
            ctx.fillStyle='#111';
            ctx.fillRect(x+6,y+6,4,4);
            ctx.fillRect(x+e.w-12,y+6,4,4);
        }

        const px = player.x - cameraX, py = player.y; ctx.save();
        // 🔸 ダメージ中の赤点滅処理
        let flashRed = false;
        if (player.damageFlashUntil && performance.now() < player.damageFlashUntil) {
            // 点滅（0.1秒周期でON/OFF）
            flashRed = Math.floor(performance.now() / 100) % 2 === 0;
        }
        if (flashRed) {
            ctx.fillStyle = '#f44'; // 赤点滅
        } else {
            ctx.fillStyle = '#fff'; // 通常白
        }
        // 無敵中は半透明
        if(performance.now() < player.invincibleUntil){
            ctx.globalAlpha = 0.6;
        }
        // 無敵中の点滅処理
        if(performance.now() < player.invincibleUntil){
            if(Math.floor(performance.now()/100) % 2 === 0) ctx.globalAlpha = 0.4;
        }

        // 体部分
        const ph = player.crouch ? player.h*0.6 : player.h;
        ctx.fillRect(px, py + (player.h - ph), player.w, ph);

        // 顔（目）部分
        ctx.fillStyle = '#222';
        const eyeY = py + 10 + (player.h - ph);
        let eyeX;
        // 向きによって目の位置を変更
        if (player.facing === 'right') {
            eyeX = px + player.w - 8 - 6;      // 左向き：右端基準で反転
        } else {
            eyeX = px + 8;                     // 今まで通り
        }
        ctx.fillRect(eyeX, eyeY, 6, 6);
        ctx.restore();

        // 🔸滑っているときに足元に白いスリップラインを出す（演出）
        if (player.onGround && Math.abs(player.vx) > 0.5 && !keys.left && !keys.right) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#fff';
            ctx.fillRect(player.x, player.y + player.height - 5, 20, 2);
            ctx.globalAlpha = 1.0;
        }
        // パーティクル描画
        drawParticles(ctx, cameraX);

        // スタート時のカウントダウン表示
        if (gameState === "countdown" && countdown !== null) {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(0,0,W,H);
            ctx.fillStyle = "#fff";
            ctx.font = "80px sans-serif";
            ctx.textAlign = "center";
            const text = (countdown === 0) ? "START!" : String(countdown);
            ctx.fillText(text, W / 2, H / 2);
        }
        // ゴール演出
        if(goal.reached){
            if(goal.anim > 0){ goal.anim -= 0.02; }
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
            ctx.fillStyle = '#fff'; ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ゴール！', W/2, H/2 - 20);
        }
        // タイムアップ判定
        if(finished && !goal.reached){
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
            ctx.fillStyle = '#fff'; ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('タイムオーバー', W/2, H/2 - 20);
            setTimeout(500); // 0.5秒後に結果画面表示
            gameState = "gameover";
            showScreen("gameover");
            setKeyConfigEnabled(true); // キー設定を有効化
        }

        // 結果画面へ遷移
        if (gameState === "playing" && goal.reached && finishedEffectEnded) {
            gameState = "result";
            showResultScreen();
            setKeyConfigEnabled(true); // キー設定を有効化
        }
    }

    //===========================================================
    // メインループ
    //===========================================================
    let last = performance.now();
    function loop(t){
        const dt = (t - last) / 1000; last = t;
        update(dt);
        // ゴールに到達した瞬間のパーティクルは spawnGoalParticles 内で処理済み
        updateParticles();
        draw();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    //===========================================================
    // 画面表示切替処理
    //===========================================================
    function showScreen(name) {
        titleScreen.style.display = (name === "title") ? "flex" : "none";
        gameScreen.style.display = (name === "playing") ? "flex" : "none";
        resultScreen.style.display = (name === "result") ? "grid" : "none";
        gameOverScreen.style.display = (name === "gameover") ? "flex" : "none";
    }

    //===========================================================
    // ゲーム開始・リスタート処理
    //===========================================================
    // ===== プレイ前カウントダウン処理 =====
    function startCountdown() {
        let count = 3;
        countdown = count;
        const interval = setInterval(() => {
            console.log("Countdown:", count);
            count--;
            countdown = Math.max(0, count + 0); // 0..3 を保持（負になったら 0 表示後解除）
            if (count < 0) {
                clearInterval(interval);
                countdown = null;
                startTime = performance.now(); // カウント終了で開始時刻を持つ
                gameState = "playing"; // ★ プレイモードへ移行
            }
        }, 1000);
    }
    // ===== ゲーム開始・リスタート =====
    function startGame(){
        setKeyConfigEnabled(false); // キー設定を無効化
        // 状態初期化
        resetGameState();
        playing = true;
        // エンティティ生成
        generateEntities();
        // ✅ プレイ前カウントダウン（例：3 → 2 → 1 → START）
        startCountdown();
    }
    // ===== ゲーム状態リセット処理 =====
    function resetGameState() {
        // ===== プレイヤー初期化 =====
        player.x = 80; 
        player.y = 300;
        player.vx = 0;
        player.vy = 0;
        player.onGround = false;
        player.crouch = false;
        player.invincibleUntil = 0;
        player.damageFlashUntil = 0;

        // ===== 入力状態初期化 =====
        jumpPressed = false;

        // ===== ゲーム進行状態 =====
        score = 0;
        elapsed = 0;
        startTime = null;
        goal.reached = false;
        goal.anim = 0;
        finishedEffectEnded = false;
        finished = false;

        // ===== カメラ =====
        cameraX = 0;

        // ===== エンティティ =====
        enemies = [];
        items = [];

        // ===== HUD 表示 =====
        elScore.textContent = "Score: -";
        elTime.textContent  = "Time: -";

        // ===== カウントダウン =====
        countdown = null;
    }

    // ===== プレイ開始でタイトルを消し、ゲームを開始 =====
    startBtn.onclick = () => {
        gameState = "countdown"; // ★ カウントダウンモードへ突入
        showScreen("playing");
        startGame(); // 既存のゲーム開始処理を呼ぶ
    };

    //===========================================================
    // 終了処理 → リザルトへ
    //===========================================================
    async function showResultScreen() {
        resultItemDetail.innerHTML = "";
        resultEnemyDetail.innerHTML = "";
        resultScreen.style.display = "grid";
        let displayScore = 0;
        resultScore.textContent = displayScore;

        // ========= 1. アイテム加算 =========
        const itemStats = getItemStats();
        for (const type of [1,2,3]) {
            const count = itemStats[type];
            const unitScore = ITEM_SCORE[type];

            const row = document.createElement("div");
            row.className = "resultRow";

            const icon = document.createElement("div");
            icon.className = "coin";
            icon.style.background = ITEM_COLORS[type];

            const text = document.createElement("span");
            text.textContent = `(+${unitScore})  × ${count}`;

            row.append(icon, text);
            resultItemDetail.appendChild(row);

            for (let i = 0; i < itemStats[type]; i++) {
                await wait(150);
                displayScore += unitScore;
                resultScore.textContent = displayScore;
            }
        }
        // ========= 2. 敵ダメージ減算 =========
        const enemyStats = getEnemyStats();
        for (const type of [1,2,3]) {
            const count = enemyStats[type];
            const damage = ENEMY_DAMAGE[type];

            const row = document.createElement("div");
            row.className = "resultRow";

            const icon = document.createElement("div");
            icon.className = "enemy";
            icon.style.background = ENEMY_COLORS[type];

            const text = document.createElement("span");
            text.textContent = `(-${damage})  × ${count}`;

            row.append(icon, text);
            resultEnemyDetail.appendChild(row);

            for (let i = 0; i < enemyStats[type]; i++) {
                await wait(150);
                displayScore = Math.max(0, displayScore - damage);
                resultScore.textContent = displayScore;
            }
        }
        // ========= 3. 残り時間加算 =========
        const timeRemaining = Math.max(0, Math.floor(TIME_LIMIT - elapsed));
        resultTime.textContent = timeRemaining;

        for (let i = 0; i < timeRemaining; i++) {
            await wait(50);
            displayScore++;
            resultScore.textContent = displayScore;
        }
        gameState = "finished";
    }
    // (回数集計)
    function getItemStats(){
        return {
            1: items.filter(i => i.collected && i.type === 1).length,
            2: items.filter(i => i.collected && i.type === 2).length,
            3: items.filter(i => i.collected && i.type === 3).length
        };
    }
    function getEnemyStats(){
        return {
            1: enemies.reduce((s, e) => s + (e.type === 1 ? (e.hit || 0) : 0), 0),
            2: enemies.reduce((s, e) => s + (e.type === 2 ? (e.hit || 0) : 0), 0),
            3: enemies.reduce((s, e) => s + (e.type === 3 ? (e.hit || 0) : 0), 0)
        };
    }
    // ===== 指定ミリ秒待機するPromise =====
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== JSTの日付文字列を取得（YYYY-MM-DD形式）=====
    function getJSTDateString() {
        const now = new Date();
        const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        return jst.toISOString().slice(0, 10); // YYYY-MM-DD
    }
    // ===== シード付き乱数生成関数 =====
    function createSeededRandom(seedStr) {
        let seed = 0;
        for (let i = 0; i < seedStr.length; i++) {
            seed = (seed << 5) - seed + seedStr.charCodeAt(i);
            seed |= 0;
        }
        return function () {
            seed = (seed * 1664525 + 1013904223) | 0;
            return ((seed >>> 0) / 4294967296);
        };
    }

    //===========================================================
    // タイトルへ戻る処理
    //===========================================================
    backToTitleBtn.onclick = () => {
        // ===== 状態フラグを戻す =====
        gameState = "title";
        resetGameState();
        // ===== タイトル画面を表示 =====
        showScreen("title");
    };
    gameOverToTitleBtn.onclick = () => {
        // ===== 状態フラグを戻す =====
        gameState = "title";
        resetGameState();
        // ===== タイトル画面を表示 =====
        showScreen("title");
    };
})();
