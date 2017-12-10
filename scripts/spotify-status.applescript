if application "Spotify" is running then 
	tell application "Spotify"
		if player state = playing then
			return true
		else
			return
		end if
	end tell
end if