# Label Studio Frontend &middot; ![GitHub](https://img.shields.io/github/license/heartexlabs/label-studio?logo=heartex) ![build](https://github.com/heartexlabs/label-studio-frontend/workflows/Build%20and%20Test/badge.svg) ![GitHub release](https://img.shields.io/github/v/release/heartexlabs/label-studio-frontend?include_prereleases) &middot; :sunny:

[Website](https://labelstud.io/) • [Docs](https://labelstud.io/guide) • [Twitter](https://twitter.com/heartexlabs) • [Join Slack Community <img src="https://go.heartex.net/docs/images/slack-mini.png" width="18px"/>](https://docs.google.com/forms/d/e/1FAIpQLSdLHZx5EeT1J350JPwnY2xLanfmvplJi6VZk65C2R4XSsRBHg/viewform?usp=sf_link)

<br/>

**Label Studio is an open-source, configurable data annotation tool. :v:**

Frontend, as its name suggests, is the frontend library developed using React and mobx-state-tree, distributed as an NPM package. You can include it in your applications and provide data annotation support to your users. It can be granularly customized and extended. 

<br/>

## Install

```bash
npm install label-studio
```

## Usage

```xhtml
<!-- Include Label Studio stylesheet -->
<link href="https://unpkg.com/label-studio@0.7.3/build/static/css/main.09b8161e.css" rel="stylesheet">

<!-- Create the Label Studio container -->
<div id="label-studio"></div>

<!-- Include the Label Studio library -->
<script src="https://unpkg.com/label-studio@0.7.3/build/static/js/main.e963e015.js"></script>

<!-- Initialize Label Studio -->
<script>
  var labelStudio = new LabelStudio('label-studio', {
    config: `
      <View>
        <Image name="img" value="$image"></Image>
        <RectangleLabels name="tag" toName="img">
          <Label value="Hello"></Label>
          <Label value="World"></Label>  
        </RectangleLabels>
      </View>
    `,

    interfaces: [
      "panel",
      "update",
      "controls",
      "side-column",
      "completions:menu",
      "completions:add-new",
      "completions:delete",
      "predictions:menu",
    ],

    user: {
      pk: 1,
      firstName: "James",
      lastName: "Dean"
    },

    task: {
      completions: [],
      predictions: [],
      id: 1,
      data: {
        image: "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg"
      }
    },
    
    onLabelStudioLoad: function(LS) {
      var c = LS.completionStore.addCompletion({
        userGenerate: true
      });
      LS.completionStore.selectCompletion(c.id);
    }
  });
</script>    
```

## Development

1. Clone the repository
   ```bash
   git clone git@github.com:heartexlabs/label-studio-frontend.git
   # or: git clone https://github.com/heartexlabs/label-studio-frontend.git
   cd label-studio-frontend
   ```

2. Install required dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run start
   ```
   
4. Check different ways to initiate the development server config & task data in `src/env/development.js`, changing the `data` variable is a good place to start.

5. After you make changes and ready to use it in production, you need to create a production build
   ```bash
   npm run build-bundle
   ```
   Now you have one .js file and one .css file in the `build/static/` directory

## Label Studio for Teams, Startups, and Enterprises :office:

Label Studio for Teams is our enterprise edition (cloud & on-prem), that includes a data manager, high-quality baseline models, active learning, collaborators support, and more. Please visit the [website](https://www.heartex.ai/) to learn more.

## Ecosystem

| Project | Description |
|-|-|
| [label-studio](https://github.com/heartexlabs/label-studio) | Server part, distributed as a pip package |
| label-studio-frontend | Frontend part, written in JavaScript and React, can be embedded into your application | 
| [label-studio-converter](https://github.com/heartexlabs/label-studio-converter) | Encode labels into the format of your favorite machine learning library | 
| [label-studio-transformers](https://github.com/heartexlabs/label-studio-transformers) | Transformers library connected and configured for use with label studio | 

## License

This software is licensed under the [Apache 2.0 LICENSE](/LICENSE) © [Heartex](https://www.heartex.ai/). 2020

<img src="https://github.com/heartexlabs/label-studio/blob/master/images/opossum_looking.png?raw=true" title="Hey everyone!" height="140" width="140" />
