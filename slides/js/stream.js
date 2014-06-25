 window.addEventListener('load', function () {
    navigator.webkitGetUserMedia(
        {video: true},
        function(stream) {
            var video = document.querySelector('#camera-demo');
            video.src = window.URL.createObjectURL(stream);
        },
        function(e) {
            console.log(e);
        }
    );
});