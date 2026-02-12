// reddit_demo_server_api.gml
// Script to fetch daily artifact from the server API

// Function to fetch daily artifact
function fetch_daily_artifact() {
    // Create HTTP request
    var url = "https://your-devvit-app-url.devvit.dev/api/daily-artifact"; // Replace with actual URL
    var request_id = http_get(url);

    // Store request ID for handling response
    global.daily_artifact_request_id = request_id;

    return request_id;
}

// HTTP Async event handler (put this in Async - HTTP event)
function handle_daily_artifact_response() {
    var request_id = async_load[? "id"];

    if (request_id == global.daily_artifact_request_id) {
        if (async_load[? "status"] == 0) { // Success
            var response = async_load[? "result"];
            var data = json_parse(response);

            // Store the artifact data globally
            global.daily_artifact = data;
            global.artifact_name = data.name;
            global.artifact_description = data.description;
            global.artifact_riddle = data.riddle;
            global.artifact_hint = data.hint;
            global.artifact_lore = data.lore;
            global.artifact_year = data.year;
            global.artifact_reddit_url = data.redditUrl;
            global.artifact_image_url = data.imageUrl;

            show_debug_message("Daily artifact loaded: " + global.artifact_name);
        } else {
            show_debug_message("Failed to load daily artifact");
            // Set defaults
            global.artifact_name = "The Poop Knife";
            global.artifact_description = "A legendary Reddit artifact";
            global.artifact_riddle = "What is sharp, brown, and makes you go?";
            global.artifact_hint = "It's not what you think";
            global.artifact_lore = "The story of the poop knife...";
            global.artifact_year = "2012";
            global.artifact_reddit_url = "https://reddit.com/r/example";
            global.artifact_image_url = "https://picsum.photos/600/400";
        }
    }
}

// Call fetch_daily_artifact() in game start or room start
