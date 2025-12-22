import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { ItemStack } from "@Easy/Core/Shared/Inventory/ItemStack";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import { Mouse } from "@Easy/Core/Shared/UserInput";
import CropManager from "./CropManager";
import CropTile from "Resources/Land/CropTile";
import PlotManager from "./PlotManager";
import { getPlant } from "./PlantList";
import { Player } from "@Easy/Core/Shared/Player/Player";

export default class PlayerManager extends AirshipSingleton {
    private yourPlotIndex: number = 0;

    public hoeDigAnim?: AnimationClip;
    public hoeDigSound?: AudioSource;

    public seedAnim? : AnimationClip;

    public characterAnimationEventListener?: AnimationEventListener;

    public cameraRig: GameObject;

    private stayTimer = 0;
    private shouldStay = false;
    private stayPos: Vector3;
    private stayRot: Quaternion;

    private SIGNAL_PLAYER_PLAY_ANIMATION = new NetworkSignal<{animationName: string, player: string, rotation: Quaternion, direction: Vector3}>("SIGNAL_PLAYER_PLAY_ANIMATION");

	override Start(): void {
		print("PlayerManager initialized.");

        this.registerInventoryItems();
        if (Game.IsServer()) {
            this.ConnectServerSignals();
        }

        if (Game.IsClient()) {
            this.ConnectClientSignals();
        }

        // Give characters items at spawn
        if (Game.IsServer()) {
            Airship.Characters.ObserveCharacters((character) => {
                character.inventory?.AddItem(new ItemStack("Hoe", 1));
                character.inventory?.AddItem(new ItemStack("CarrotSeed", 15));
            });

            // listen when player spawns
            Airship.Players.ObservePlayers((newCharacter) => {
                //Let the server and client sync
                newCharacter.WaitForCharacter();
                //Print their display name to the console
                print("Player joined: " + newCharacter.username);

                if (newCharacter === Game.localPlayer) {
                    PlotManager.Get().sendSyncLandsSignal(newCharacter);
                }
            })
        }
	}

    @Client()
    override Update(dt: number): void {
        if (this.shouldStay) {
            Game.localPlayer.character!.movement.transform.position = this.stayPos;
            Game.localPlayer.character!.movement.graphicTransform.rotation = this.stayRot;

            this.stayTimer += dt;
            if (this.stayTimer >= 1.3) {
                this.stayTimer = 0;
                this.shouldStay = false;
            }
        }
    }

    public registerInventoryItems(): void {
        Airship.Inventory.RegisterItem("Hoe", {
            displayName: "Hoe",
            accessoryPaths: ["Assets/Resources/ItemPrefabs/TestHoe.prefab"],
            //image: "Assets/Resources/ItemPrefabs/cat.png",
        });
        // // Register a new item type
        // Airship.Inventory.RegisterItem("Carrot", {
        //     displayName: "Carrot",
        //     accessoryPaths: ["Assets/Resources/ItemPrefabs/Carrot.prefab"],
        //     //image: "Assets/Resources/ItemPrefabs/cat.png",
        // });

        // Airship.Inventory.RegisterItem("Potato", {
        //     displayName: "Potato",
        //     accessoryPaths: ["Assets/Resources/ItemPrefabs/Potato.prefab"],
        //     //image: "Assets/Resources/ItemPrefabs/cat.png",
        // });

        // Airship.Inventory.RegisterItem("Wheat", {
        //     displayName: "Wheat",
        //     accessoryPaths: ["Assets/Resources/ItemPrefabs/Wheat.prefab"],
        //     //image: "Assets/Resources/ItemPrefabs/cat.png",
        // });

        // Airship.Inventory.RegisterItem("CarrotSeed", {
        //     displayName: "Carrot Seed",
        //     accessoryPaths: ["Assets/Resources/ItemPrefabs/SeedPack.prefab"],
        //     //image: "Assets/Resources/ItemPrefabs/cat.png",
        // });

        // Airship.Inventory.RegisterItem("PotatoSeed", {
        //     displayName: "Potato Seed",
        //     accessoryPaths: ["Assets/Resources/ItemPrefabs/SeedPack.prefab"],
        //     //image: "Assets/Resources/ItemPrefabs/cat.png",
        // });

        // Airship.Inventory.RegisterItem("WheatSeed", {
        //     displayName: "Wheat Seed",
        //     accessoryPaths: ["Assets/Resources/ItemPrefabs/SeedPack.prefab"],
        //     //image: "Assets/Resources/ItemPrefabs/cat.png",
        // });

        // automate this thing instead of manually adding every item

    }

    @Server()
    private ConnectServerSignals(): void {
        this.SIGNAL_PLAYER_PLAY_ANIMATION.server.OnClientEvent((player, data) => {
            print("SERVER: Player " + data.player + " played animation: " + data.animationName);

            this.SIGNAL_PLAYER_PLAY_ANIMATION.server.FireAllClients(data);
        });
    }

    @Client()
    private ConnectClientSignals(): void {
		// Create raycaster for mouse clicks in 3D space.
		Mouse.onLeftDown.Connect(() => {
            print(Game.localPlayer.character?.gameObject.name);
            this.characterAnimationEventListener = Game.localPlayer.character?.gameObject.GetComponent<CharacterAnimationHelper>()?.animationEvents;

            this.characterAnimationEventListener?.OnAnimEvent((key)=>{
                //Key is the string value you specify in editor
                if(key === "hoeDigged"){
                    this.hoeDigSound?.Play();
                }
            })


            const screenPos3 = new Vector3(Mouse.position.x, Mouse.position.y, 0);
            const ray = Camera.main.ScreenPointToRay(screenPos3);

            const [hit, point, normal, collider] = Physics.Raycast(ray.origin, ray.direction, 1000);

			// If raycast hits an object.
            if (hit && collider) {
                const picked = collider.gameObject;
            
                if (picked.tag === "Dirt") {
                    const dirtData = picked?.gameObject.GetAirshipComponent<CropTile>()?.getCoords() as String[];
                    const distanceToPlayer = Vector3.Distance(Game.localPlayer.character!.transform.position, picked.transform.position);
                    const cropScript = picked?.gameObject.GetAirshipComponent<CropTile>();

                    if (distanceToPlayer > 1.5) {
                        return;
                    } else if (distanceToPlayer < 0.5) {
                        return;
                    }

                    if (this.shouldStay) {
                        return;
                    }

                    let item = "none";
                    Airship.Inventory.ObserveLocalHeldItem((itemStack) => {
                        item = itemStack?.itemDef.itemType || "none";
                    });

                    const cropPlotIndex = tonumber(cropScript?.getCoords()[0]) || 0;
                    if (cropPlotIndex === this.yourPlotIndex) {
                        PlotManager.Get().sendDirtSignal(
                            this.yourPlotIndex,
                            tonumber(dirtData[1]) || 0,
                            tonumber(dirtData[2]) || 0,
                            tonumber(dirtData[3]) || 0,
                            tonumber(dirtData[4]) || 0,
                            item,
                            "none",
                            Game.localPlayer.userId
                        )
                    }

                    const dirtPos = picked.transform.position;
                    const characterPos = Game.localPlayer.character!.transform.position;

                    const dir = Vector3.Normalize(
                        new Vector3(dirtPos.x - characterPos.x, 0, dirtPos.z - characterPos.z)
                    );

                    const _lookRotation = Quaternion.LookRotation(dir);

                    if (item !== "none") {
                        // rotate character towards clicked dirt
                        Game.localPlayer.character!.movement.graphicTransform.rotation = _lookRotation;
                        Game.localPlayer.character!.movement.SetLookVector(dir);

                        this.stayPos = Game.localPlayer.character!.movement.graphicTransform.position;
                        this.stayRot = Game.localPlayer.character!.movement.graphicTransform.rotation;
                        this.shouldStay = true;
                    } else {
                        return;
                    }

                    if (item === "Hoe") {
                        Game.localPlayer.character?.animationHelper.PlayAnimation(this.hoeDigAnim!, CharacterAnimationLayer.OVERRIDE_1, 0.1);
                        this.SIGNAL_PLAYER_PLAY_ANIMATION.client.FireServer({
                            animationName: "HoeDig",
                            player: Game.localPlayer.userId,
                            rotation: Game.localPlayer.character!.movement.graphicTransform.rotation,
                            direction: dir
                        });
                    } else if (item === "CarrotSeed" || item === "PotatoSeed") {
                        Game.localPlayer.character?.animationHelper.PlayAnimation(this.seedAnim!, CharacterAnimationLayer.OVERRIDE_1, 0.1);
                        this.SIGNAL_PLAYER_PLAY_ANIMATION.client.FireServer({
                            animationName: "SeedPack",
                            player: Game.localPlayer.userId,
                            rotation: Game.localPlayer.character!.movement.graphicTransform.rotation,
                            direction: dir
                        });
                    }
                }
            }
        });

        this.SIGNAL_PLAYER_PLAY_ANIMATION.client.OnServerEvent((data) => {
            print("CLIENT: Player " + data.player + " played animation: " + data.animationName);

            let animClip: AnimationClip;
            if (data.animationName === "HoeDig") {
                animClip = this.hoeDigAnim!;
            } else if (data.animationName === "SeedPack") {
                animClip = this.seedAnim!;
            }

            if (data.player === Game.localPlayer.userId) {
                return;
            }

            const _lookRotation = Quaternion.LookRotation(data.direction);

            Airship.Characters.ObserveCharacters((character) => {
                if (character.player?.userId === data.player) {
                    character.animationHelper.PlayAnimation(animClip, CharacterAnimationLayer.OVERRIDE_1, 0.1);

                    character.movement.graphicTransform.rotation = _lookRotation
                }
            });
        });
    }

    // ONLY FOR WEIGHT ITEM CLARIFICATION AND CREATION
    // (Carrot -> Carrot [50g], Carrot -> Carrot [100g] etc.)

    public registerNewInventoryItem(itemTypeBase: string, newName: string, amount: number = 1): void {
        // Register a new item type to make sure there's a lot of variants of weights for items
        Airship.Inventory.RegisterItem(newName, {
            displayName: newName,
            accessoryPaths: ["Assets/Resources/ItemPrefabs/" + itemTypeBase + ".prefab"],
        });

        print("Registered new item: " + newName);
    }

    public getCameraRig(): GameObject {
        return this.cameraRig;
    }

    public setPlayerPlotIndex(plotIndex: number): void {
        this.yourPlotIndex = plotIndex;
    }

    public generateRandomWeight(name: string): string {
        const minWeight = getPlant(name)!.minWeight;
        const maxWeight = getPlant(name)!.maxWeight;

        const randomWeight = math.random(minWeight, maxWeight);
        const weightText = name + " [" + randomWeight + "g]";

        this.registerNewInventoryItem(name, weightText, 1);

        return weightText;
    }
}


/*

// Everything is alright.
Airship.Inventory.ObserveLocalHeldItem((itemStack) => {
    if (itemStack?.itemDef.displayName === "Carrot") {
        // Test random weight application.
        const randomWeight = math.random(30, 150);
        const weightText = "Carrot [" + randomWeight + "g]";

        this.registerNewInventoryItem("Carrot", weightText, "Assets/Resources/ItemPrefabs/cat.png", 1);

        itemStack.Decrement(1);
        Game.localPlayer.character?.inventory.AddItem(new ItemStack(weightText));
    }
});

*/