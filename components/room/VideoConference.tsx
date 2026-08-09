import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { useTracks } from "@livekit/react-native"
import { ParticipantKind, Track } from "livekit-client"

import { ParticipantTile } from "@/components/participant/ParticipantTile"
import { TEXT_COLORS } from "@/constants/colors"

const tracksOption = [
  { source: Track.Source.Camera, withPlaceholder: true },
  { source: Track.Source.ScreenShare, withPlaceholder: false },
]

const VISIBLE_PARTICIPANT_KINDS: ParticipantKind[] = [
  ParticipantKind.STANDARD,
  ParticipantKind.SIP,
]

export const VideoConference = () => {
  const tracks = useTracks(tracksOption)

  const participantTracks = useMemo(
    () =>
      tracks.filter(track =>
        VISIBLE_PARTICIPANT_KINDS.includes(track.participant.kind),
      ),
    [tracks],
  )

  if (participantTracks.length === 0) {
    return (
      <View style={styles.noVideo}>
        <Text style={styles.noVideoText}>No participants in the room</Text>
      </View>
    )
  }

  return (
    <View style={styles.participantsContainer}>
      {participantTracks.map(track => (
        <ParticipantTile
          key={`${track.participant.identity}-${track.source}`}
          trackRef={track}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  noVideo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoText: {
    color: TEXT_COLORS.light,
    fontSize: 16,
  },
  participantsContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
  },
})
