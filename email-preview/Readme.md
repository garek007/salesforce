## Preview an Email in the Context of a Subscriber

### Use at your own risk
The preview endpoint is undocumented and unsupported. It could go away at any time.

### First thing first
This is not fully built out. I started it as a proof of concept, but not sure I'll end up needing it, so for now, I just parked it here. 

### Setup
You'll need three CloudPages. 

- You'll need one main CloudPage to host the HTML and JavaScript. This doesn't have any SSJS or AmpScript though, so technically could be hosted anywhere. 
- You'll need one page which renders the email /render
  - At first I tried to use ajax to request the HTML and send it back to the page, then append. That worked, but I lost all of the styles since the css in the HTML content took on the styles from my page stylesheet. In the end, it was faster to load a separate URL into an iframe
  - Again with this, it uses the API, so you could rework it and host it outside of MC if you wanted to
- You'll need one CloudPage for your functions /assetretrieve
  - In the past, I've broken up functionality into separate CloudPages, one page for each thing, but I decided instead to drop all my functions into one page and use a switch statement to pick which one I need. More efficient than having so many CloudPages out there, since they aren't easy to navigate.

