import { useTracks } from "@livekit/react-native"
import { View, Text, StyleSheet, Dimensions } from "react-native"
import { Track } from "livekit-client"
import { VideoTrack } from "@livekit/react-native"

const { width, height } = Dimensions.get("window")

const tracksOption: Track.Source[] = [
  Track.Source.Camera,
  Track.Source.ScreenShare,
  Track.Source.Microphone,
]

export const VideoConference = () => {
  const tracks = useTracks(tracksOption)

  if (tracks.length === 0) {
    return (
      <View style={styles.noVideo}>
        <Text style={styles.noVideoText}>No video streams available</Text>
      </View>
    )
  }

  return (
    <View style={styles.participantsContainer}>
      {tracks.map((track) => (
        <View
          key={track.publication.trackSid}
          style={styles.participantContainer}
        >
          <VideoTrack
            style={styles.videoView}
            trackRef={track}
            mirror={track.participant.isLocal}
          />

          <Text style={styles.participantName}>
            {track.participant.name || track.participant.identity}
            {track.participant.isLocal ? " (You)" : ""}
          </Text>
        </View>
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
    color: "#fff",
    fontSize: 16,
  },
  participantsContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
  },
  participantContainer: {
    width: width / 2 - 15,
    height: height / 3,
    margin: 5,
    backgroundColor: "#333",
    borderRadius: 8,
    overflow: "hidden",
  },
  videoView: {
    flex: 1,
  },
  participantName: {
    position: "absolute",
    bottom: 10,
    left: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
})
