function updateClock() {
            
            const now = new Date();
            
            let date = now.getDate();
            let month = now.getMonth() + 1;
            let year = now.getFullYear();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            let seconds = now.getSeconds();
            let session = "AM";
            
            if (hours === 0) {
                hours = 12;
            } else if (hours > 12) {
                hours = hours - 12;
                session = "PM";
            }
            
            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;
            const dateString = `${date}/${month}/${year}`;
            const timeString = `${hours}:${minutes}:${seconds} ${session}`;
            document.getElementById("clock").textContent = `${dateString} ${timeString}`;
        }
        updateClock();
        setInterval(updateClock, 1000);
