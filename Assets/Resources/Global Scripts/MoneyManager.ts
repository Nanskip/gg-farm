// money manager manages money transfers with server based behaivour

import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import { Player } from "@Easy/Core/Shared/Player/Player";

export default class MoneyManager extends AirshipSingleton {

	public moneyText: TMP_Text;

	private localMoney: number = 0;
	private serverMoneyStorage: Map<string, number> = new Map<string, number>();
	private addMoneySignal = new NetworkSignal<{amount: number}>("ADD_MONEY");
	// userId: amount

	private MONEY_SYNC = new NetworkSignal<{amount: number}>("MONEY_SYNC");

	override Start(): void {
		if (Game.IsServer()) {
			this.ConnectServerSignals();
		}

		if (Game.IsClient()) {
			this.ConnectClientSignals();
		}
	}

	private updateMoneyTimer = 0;
	override Update(dt: number): void {
		if (Game.IsServer()) {
			this.updateMoneyTimer += dt;

			if (this.updateMoneyTimer >= 5) {
				// sync money for all players every 5 seconds

				Airship.Players.ObservePlayers((player) => {
					if (!this.serverMoneyStorage.has(player.userId)) {
						this.initPlayerMoney(player);
					}
					
					this.MONEY_SYNC.server.FireClient(player, {amount: this.serverMoneyStorage.get(player.userId) || 0});
				});

				this.updateMoneyTimer = 0;
			}
		}
	}

	@Client()
	private ConnectClientSignals(): void {
		this.MONEY_SYNC.client.OnServerEvent((data) => {
			this.localMoney = data.amount;
			this.updateMoney();

			print("CLIENT: Money sync.")
		});
	}

	@Server()
	private ConnectServerSignals(): void {
		this.MONEY_SYNC.server.OnClientEvent((player, data) => {
			// just sync money with client, ignore data.amount
			print("SERVER: Money sync.")
			if (!this.serverMoneyStorage.has(player.userId)) {
				this.initPlayerMoney(player);
			}

			this.MONEY_SYNC.server.FireClient(player, {amount: this.serverMoneyStorage.get(player.userId) || 0});
		});

		this.addMoneySignal.server.OnClientEvent((player, data) => {
			print("SERVER: Add money.")
			if (!this.serverMoneyStorage.has(player.userId)) {
				this.initPlayerMoney(player);
			}
			const availableMoney = this.serverMoneyStorage.get(player.userId) || 0;

			this.serverMoneyStorage.set(player.userId, availableMoney + data.amount);

			this.MONEY_SYNC.server.FireClient(player, {amount: this.serverMoneyStorage.get(player.userId) || 0});
		});
	}

	@Client()
	public updateMoney(): void {
		this.moneyText.text = "Money: " + tostring(this.localMoney);
		print("CLIENT: Money update: " + this.localMoney);
	}

	@Server()
	private initPlayerMoney(player: Player): void {
		if (this.serverMoneyStorage.has(player.userId)) {
			return;
		}

		print("SERVER: Init player money: " + player.userId);
		this.serverMoneyStorage.set(player.userId, 50);
	}

	@Client()
	public addMoney(amount: number): void {
		this.addMoneySignal.client.FireServer({amount: amount});
	}
}
