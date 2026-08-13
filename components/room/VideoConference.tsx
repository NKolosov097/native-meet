import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { useTracks } from "@livekit/react-native"
import { ParticipantKind, Track } from "livekit-client"

import { PaginationBar } from "@/components/room/grid/PaginationBar"
import { ParticipantGrid } from "@/components/room/grid/ParticipantGrid"
import { useParticipantGrid } from "@/components/room/grid/useParticipantGrid"
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

  const {
    onContainerLayout,
    visibleItems,
    tileWidth,
    tileHeight,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
  } = useParticipantGrid(participantTracks)

  if (participantTracks.length === 0) {
    return (
      <View style={styles.noVideo}>
        <Text style={styles.noVideoText}>No participants in the room</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ParticipantGrid
        tracks={visibleItems}
        tileWidth={tileWidth}
        tileHeight={tileHeight}
        onLayout={onContainerLayout}
      />

      {totalPages > 1 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noVideo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoText: {
    color: TEXT_COLORS.light,
    fontSize: 16,
  },
})
