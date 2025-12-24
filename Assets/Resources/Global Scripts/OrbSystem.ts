
// OrbSystem.ts
// This manager handles Orb amount on server, syncs it to clients and allows
// players to ask for any orb interactions.

import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import ObjectUtils from "@Easy/Core/Shared/Util/ObjectUtils";

export default class OrbSystem extends AirshipSingleton {

	private serverOrbData: Record<string, number> = {}; // userId: amount
	private serverOrbCoords: Record<string, number> = {}; // tostring(vec.x .. "," .. vec.y .. "," .. vec.z): (time to live)
	private clientOrbCoords: Record<string, GameObject> = {}; // tostring(vec.x .. "," .. vec.y .. "," .. vec.z): GameObject

	@Header("UI")
	public OrbAmountText: TMP_Text;

	@Header("Orb Prefabs")
	public orbPrefab: GameObject;

	// Signals
	private SIGNAL_ORB_AMOUNT = new NetworkSignal<{amount: number}>("ORB_AMOUNT");
	private SIGNAL_CREATE_ORB = new NetworkSignal<{pos: Vector3, orbType: number}>("CREATE_ORB");
	private SIGNAL_REMOVE_ORB = new NetworkSignal<{pos: Vector3}>("REMOVE_ORB");
	private SIGNAL_PICKUP_ORB = new NetworkSignal<{pos: Vector3, player: string}>("PICKUP_ORB");

	override Start(): void {
		if (Game.IsServer()) {
			this.ConnectServerSignals();
		}

		if (Game.IsClient()) {
			this.ConnectClientSignals();
		}
	}

	private syncTimer = 5;
	private orbTimer = 0;
	private orbProcessTimer = 0;

	private maxOrbs = 10 as const;

	override Update(dt: number): void {
		if (Game.IsClient()) {
			this.syncTimer += dt;

			if (this.syncTimer >= 5) {
				this.syncTimer = 0;

				this.SIGNAL_ORB_AMOUNT.client.FireServer({amount: 0});
			}
		}

		if (Game.IsServer()) {
			this.orbTimer += dt;

			if (this.orbTimer >= 1 && ObjectUtils.keys(this.serverOrbCoords).size() < this.maxOrbs) {
				this.randOrbPos();

				this.orbTimer = 0;
			}

			this.orbProcessTimer += dt;

			if (this.orbProcessTimer >= 1) {
				this.orbProcessTimer = 0;

				for (const key of ObjectUtils.keys(this.serverOrbCoords)) {
					if (this.serverOrbCoords[key] > 0) {
						this.serverOrbCoords[key] -= 1;
					} else {
						delete this.serverOrbCoords[key];
						let [x, y, z] = string.match(tostring(key), "([^,]+),([^,]+),([^,]+)");
						const vec = new Vector3(tonumber(x) || 0, tonumber(y) || 0, tonumber(z) || 0);

						this.SIGNAL_REMOVE_ORB.server.FireAllClients({pos: vec});

						//print("Orb removed at: " + vec);
					}
				}
			}
		}
	}

	@Server()
	private ConnectServerSignals(): void {
		Airship.Players.onPlayerJoined.Connect(async (player) => {
			if (this.serverOrbData[player.userId] === undefined) {
				this.serverOrbData[player.userId] = 0;
			}
		});

		Airship.Players.onPlayerDisconnected.Connect(async (player) => {
			if (this.serverOrbData[player.userId] !== undefined) {
				this.serverOrbData[player.userId] === undefined;
			}
		});

		this.SIGNAL_ORB_AMOUNT.server.OnClientEvent((player, data) => {
			// Send amount to client.
			this.SIGNAL_ORB_AMOUNT.server.FireClient(player, {amount: this.serverOrbData[player.userId]});
		});

		this.SIGNAL_PICKUP_ORB.server.OnClientEvent((player, data) => {
			const orb = this.serverOrbCoords[tostring(data.pos.x + "," + data.pos.y + "," + data.pos.z)];
			if (orb !== undefined) {
				print("OrbManager: Player " + player.userId + " picked up orb at: " + data.pos);

				delete this.serverOrbCoords[tostring(data.pos.x + "," + data.pos.y + "," + data.pos.z)];

				this.SIGNAL_PICKUP_ORB.server.FireAllClients({pos: data.pos, player: player.userId});

				// add 1 orb to player on server
				this.serverOrbData[player.userId]++;
				this.SIGNAL_ORB_AMOUNT.server.FireClient(player, {amount: this.serverOrbData[player.userId]});
			}
		});
	}

	@Client()
	private ConnectClientSignals(): void {
		this.SIGNAL_ORB_AMOUNT.client.OnServerEvent((data) => {
			this.OrbAmountText.text = "o\r..\rx" + tostring(data.amount);
		});

		this.SIGNAL_CREATE_ORB.client.OnServerEvent((data) => {
			this.createOrb_Client(data.pos, data.orbType);
		});

		this.SIGNAL_REMOVE_ORB.client.OnServerEvent((data) => {
			const key = tostring(data.pos.x + "," + data.pos.y + "," + data.pos.z);
			//print("CLIENT: OrbManager received signal to remove orb at: " + data.pos);

			if (this.clientOrbCoords[key]!== undefined) {
				Destroy(this.clientOrbCoords[key]);

				delete this.clientOrbCoords[key];
			}
		});

		this.SIGNAL_PICKUP_ORB.client.OnServerEvent((data) => {
			print("OrbManager: Player " + data.player + " picked up orb at: " + data.pos);

			const key = tostring(data.pos.x + "," + data.pos.y + "," + data.pos.z);
			if (this.clientOrbCoords[key] !== undefined) {
				Destroy(this.clientOrbCoords[key]);

				delete this.clientOrbCoords[key];
			}
		});
	}

	@Server()
	private randOrbPos(): void {
		const pos = new Vector3(math.random(-250, 250)/10, 50, math.random(-250, 250)/10);

		const [hit, point, normal, collider] = Physics.Raycast(pos, Vector3.down, 100);

		if (collider?.gameObject.tag !== "WorldGround") {
			return;
		}

		if (hit) {
			const pos1 = new Vector3(point.x, point.y + 1, point.z);
			this.createOrb_Server(pos1);
		}
	}

	@Server()
	private createOrb_Server(pos: Vector3, orbType: number = 1): void {
		const key = tostring(pos.x + "," + pos.y + "," + pos.z);

		if (this.serverOrbCoords[key] === undefined) {
			this.serverOrbCoords[key] = 60;
		}

		this.SIGNAL_CREATE_ORB.server.FireAllClients({pos: pos, orbType: orbType});
	}

	@Client()
	public createOrb_Client(pos: Vector3, orbType: number = 1): void {
		const obj = Object.Instantiate(this.orbPrefab, pos, Quaternion.identity);

		const key = tostring(pos.x + "," + pos.y + "," + pos.z);

		if (this.clientOrbCoords[key] !== undefined) {
			print("wha?");
		}

		this.clientOrbCoords[key] = obj;
	}

	@Client()
	public askToPickupOrb(pos: Vector3): void {
		const key = tostring(pos.x + "," + pos.y + "," + pos.z);

		if (this.clientOrbCoords[key] !== undefined) {
			print("OrbManager: Player asked to pickup orb at: " + pos);

			this.SIGNAL_PICKUP_ORB.client.FireServer({pos: pos, player: Game.localPlayer.userId});
		}
	}
}
