"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function GamePlayContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  const router = useRouter();

  useEffect(() => {
    /*
    if (!roomId) {
      router.push("/");
      return;
    }
    */

    if (!canvasRef.current || initialized.current) return;
    
    initialized.current = true;

    // WebSocket ile sunucuya (kanala) bağlan

    // We use dynamic import so Kaplay doesn't break SSR (Server-Side Rendering) by accessing `window` at the module level.
    import("kaplay").then((kaplayModule) => {
        const kaplay = kaplayModule.default;

        // Initialize Kaplay on the canvas
        const k = kaplay({
            width: 800,
            height: 600,
            background: [0, 0, 0], // Siyah arka plan
            letterbox: true,
        });

        k.loadSprite("bean", "/images/bean.png");
        k.loadSprite("grass", "/images/grass.png");

        

        k.setGravity(2400);

        const level = k.addLevel([
            "@   =     == ",
            "============="
        ], {
            tileWidth: 64,
            tileHeight: 64,
            // Define what each symbol means (in components)
            tiles: {
                "@": () => [
                    k.sprite("bean"),
                    k.area(),
                    k.body(),
                    k.anchor("bot"),
                    k.z(2),
                    "player",
                ],
                "=": () => [
                    k.sprite("grass"),
                    k.area(),
                    k.body({ isStatic: true }),
                    k.anchor("bot"),
                ],
            },
        });
        //const size = 

        k.setCamScale(.5, .5);

        const player = level.get("player")[0];
        player.add([k.text("Sen"), k.pos(0, -10)]);
        const SPEED = 200;

       

        // Always look at player
        k.onUpdate(() => {
            k.setCamPos(player.worldPos);

            
        });

        // Belli bir periyotta oyuncu verilerini senkronize et (Saniyede 15 kere ~ Her 66ms'de bir)
        k.loop(1 / 15, async () => {
            const pX = Math.round(player.pos.x);
            const pY = Math.round(player.pos.y);
        });

        // Movements
        k.onKeyPress("space", () => {
            if (player.isGrounded()) {
                player.jump(900);
            }
        });

        k.onKeyDown("left", () => {
            player.move(-SPEED, 0);
        });

        k.onKeyDown("right", () => {
            player.move(SPEED, 0);
        });
        
        k.onKeyDown("q", () => {
          console.log(player.pos);
        });

        // Fall through when down is pressed
        k.onKeyDown("down", () => {
            const p = player.curPlatform();
            if (p != null && p.has("platformEffector")) {
                p.platformIgnore.add(player);
            }
        });
    });

    // Cleanup when unmounting or leaving
    return () => {
      
    };
  }, [roomId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-col items-center justify-center">
        <h1 className="mb-6 text-3xl font-bold text-black dark:text-white">
          Oyun Ekranı {roomId ? `- Oda: ${roomId}` : ''}
        </h1>
        <div className="overflow-hidden rounded-xl border-4 border-zinc-300 shadow-2xl dark:border-zinc-800">
          <canvas ref={canvasRef} width={800} height={600} />
        </div>
      </main>
    </div>
  );
}

export default function GamePlay() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center dark:bg-zinc-950 text-white">Yükleniyor...</div>}>
      <GamePlayContent />
    </Suspense>
  );
}
