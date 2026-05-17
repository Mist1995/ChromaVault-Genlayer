# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class ColorMemoryGame(gl.Contract):
    weekly_colors: TreeMap[u32, str]
    rooms: TreeMap[str, str]
    leaderboard: TreeMap[Address, u256]
    last_played: TreeMap[Address, u32]
    players: DynArray[Address]

    def __init__(self) -> None:
        self.weekly_colors = TreeMap()
        self.rooms = TreeMap()
        self.leaderboard = TreeMap()
        self.last_played = TreeMap()
        self.players = DynArray()

    def _get_week_number(self) -> u32:
        return u32(int(gl.message.timestamp) // 604800)

    def _register_player(self, addr: Address) -> None:
        if addr not in self.leaderboard:
            self.players.append(addr)
            self.leaderboard[addr] = u256(0)

    def _distribute_xp(self, room: dict) -> None:
        xp_table = [150, 100, 70, 50, 35, 25]
        participation_xp = 20

        sorted_players = sorted(
            room["scores"].items(), key=lambda x: x[1], reverse=True
        )

        for idx, (player_addr, score) in enumerate(sorted_players):
            rank_xp = xp_table[idx] if idx < len(xp_table) else 0
            total_xp = u256(rank_xp + participation_xp)

            if score >= 700:
                total_xp += u256(50)

            for player in self.players:
                if str(player) == player_addr:
                    self.leaderboard[player] += total_xp
                    break

    @gl.public.write
    def generate_weekly_colors(self) -> None:
        week_num = self._get_week_number()
        if week_num in self.weekly_colors:
            return

        w = int(week_num)
        names = ["Ember Red", "Ocean Blue", "Jade Green", "Solar Gold", "Violet Mist", "Arctic Cyan", "Deep Coral"]
        difficulties = [1, 1, 2, 2, 3, 3, 3]
        colors = []
        for i in range(7):
            hue = (w * 137 + i * 53 + i * i * 7) % 360
            sat = 55 + ((w * 31 + i * 17) % 35)
            bri = 50 + ((w * 23 + i * 29) % 35)
            colors.append({
                "hue": hue,
                "saturation": sat,
                "brightness": bri,
                "name": names[i],
                "difficulty": difficulties[i],
            })
        self.weekly_colors[week_num] = json.dumps(colors)

    @gl.public.view
    def get_weekly_colors(self, week_num: u32) -> str:
        if week_num in self.weekly_colors:
            return self.weekly_colors[week_num]
        return "[]"

    @gl.public.write
    def create_room(self, room_id: str) -> None:
        if room_id in self.rooms:
            raise Exception("Room already exists!")

        player_addr = str(gl.message.sender_address)
        room = {
            "id": room_id,
            "host": player_addr,
            "players": [player_addr],
            "status": "waiting",
            "created_at": int(gl.message.timestamp),
            "scores": {},
        }
        self.rooms[room_id] = json.dumps(room)
        self._register_player(gl.message.sender_address)

    @gl.public.write
    def join_room(self, room_id: str) -> None:
        if room_id not in self.rooms:
            raise Exception("Room not found!")

        room = json.loads(self.rooms[room_id])

        if room["status"] != "waiting":
            raise Exception("Game already started!")
        if len(room["players"]) >= 6:
            raise Exception("Room is full!")

        player_addr = str(gl.message.sender_address)
        if player_addr not in room["players"]:
            room["players"].append(player_addr)

        self.rooms[room_id] = json.dumps(room)
        self._register_player(gl.message.sender_address)

    @gl.public.write
    def start_game(self, room_id: str) -> None:
        if room_id not in self.rooms:
            return

        room = json.loads(self.rooms[room_id])
        room["status"] = "playing"
        room["started_at"] = int(gl.message.timestamp)
        self.rooms[room_id] = json.dumps(room)

    @gl.public.write
    def submit_scores(self, room_id: str, total_score: u256) -> None:
        week_num = self._get_week_number()
        if gl.message.sender_address in self.last_played:
            if self.last_played[gl.message.sender_address] >= week_num:
                raise Exception("You already played this week!")

        self._register_player(gl.message.sender_address)
        self.last_played[gl.message.sender_address] = week_num

        score = int(total_score)
        xp = u256(20)
        if score >= 700:
            xp += u256(150)
        elif score >= 500:
            xp += u256(100)
        elif score >= 300:
            xp += u256(70)
        elif score >= 100:
            xp += u256(50)
        else:
            xp += u256(25)
        self.leaderboard[gl.message.sender_address] += xp

        if room_id in self.rooms:
            room = json.loads(self.rooms[room_id])
            player_addr = str(gl.message.sender_address)
            room["scores"][player_addr] = score
            all_submitted = all(p in room["scores"] for p in room["players"])
            if all_submitted:
                room["status"] = "finished"
            self.rooms[room_id] = json.dumps(room)

    @gl.public.view
    def get_room(self, room_id: str) -> str:
        if room_id not in self.rooms:
            return "{}"
        return self.rooms[room_id]

    @gl.public.view
    def get_player_xp(self, player: Address) -> u256:
        if player in self.leaderboard:
            return self.leaderboard[player]
        return u256(0)

    @gl.public.view
    def can_play_this_week(self, player: Address, week_num: u32) -> bool:
        if player not in self.last_played:
            return True
        return self.last_played[player] < week_num

    @gl.public.view
    def get_leaderboard_top10(self) -> str:
        entries = []
        for player in self.players:
            xp = self.leaderboard[player] if player in self.leaderboard else u256(0)
            entries.append({"address": str(player), "xp": int(xp)})

        entries.sort(key=lambda x: x["xp"], reverse=True)
        return json.dumps(entries[:10])
