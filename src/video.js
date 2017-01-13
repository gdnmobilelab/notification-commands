// This is for iOS only

module.exports = {
    playOrPause(opts, event) {
        let video = event.notification.video;
        if (video.isPlaying) {
            video.pause();
        } else {
            video.play();
        }
    },
    muteOrUnmute(opts, event) {
        let video = event.notification.video;
        if (video.isMuted) {
            video.unmute();
        } else {
            video.mute();
        }
    }
}