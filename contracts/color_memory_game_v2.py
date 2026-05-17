# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class ColorMemoryGame(gl.Contract):
    weekly_colors: TreeMap[str, str]     # key = str(week_num)
    rooms: TreeMap[str, str]
    last_played: TreeMap[str, str]        # key = str(address), value = str(week_num)
    leaderboard_data: TreeMap[str, str]  # key="board" → JSON [{address, xp}]

    def __init__(self):
        pass

    def _get_sender(self) -> str:
        return str(gl.message.sender_address)

    def _get_board(self) -> list:
        if "board" in self.leaderboard_data:
            return json.loads(self.leaderboard_data["board"])
        return []

    def _add_xp(self, addr_str: str, xp: int) -> None:
        board = self._get_board()
        for e in board:
            if e["address"] == addr_str:
                e["xp"] += xp
                board.sort(key=lambda x: x["xp"], reverse=True)
                self.leaderboard_data["board"] = json.dumps(board[:50])
                return
        board.append({"address": addr_str, "xp": xp})
        board.sort(key=lambda x: x["xp"], reverse=True)
        self.leaderboard_data["board"] = json.dumps(board[:50])

    @gl.public.write
    def generate_weekly_colors(self, week_key: str) -> None:
        if week_key in self.weekly_colors:
            return

        w = int(week_key)
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
        self.weekly_colors[week_key] = json.dumps(colors)

    @gl.public.view
    def get_weekly_colors(self, week_num: str) -> str:
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
            "scores": {},
        }
        self.rooms[room_id] = json.dumps(room)

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

    @gl.public.write
    def start_game(self, room_id: str) -> None:
        if room_id not in self.rooms:
            return
        room = json.loads(self.rooms[room_id])
        room["status"] = "playing"
        self.rooms[room_id] = json.dumps(room)

    @gl.public.write
    def submit_scores(self, room_id: str, total_score: u256, week_key: str) -> None:
        player_key = self._get_sender()
        played_key = player_key + ":" + week_key
        score = int(total_score)

        if played_key not in self.last_played:
            self.last_played[played_key] = "1"
            xp = 20
            if score >= 700:
                xp += 150
            elif score >= 500:
                xp += 100
            elif score >= 300:
                xp += 70
            elif score >= 100:
                xp += 50
            else:
                xp += 25
            self._add_xp(player_key, xp)

        if room_id in self.rooms:
            room = json.loads(self.rooms[room_id])
            room["scores"][player_key] = score
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
    def get_leaderboard_top10(self) -> str:
        board = self._get_board()
        return json.dumps(board[:10])

    @gl.public.view
    def can_play_this_week(self, player: str, week_num: str) -> bool:
        played_key = player + ":" + week_num
        return played_key not in self.last_played
