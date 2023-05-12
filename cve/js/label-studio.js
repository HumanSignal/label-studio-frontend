import {createCategories} from "./categories.js";
import {createRatedFiles} from "./d2h-hook/main.js";

import {Diff2HtmlUI} from "diff2html/lib/ui/js/diff2html-ui.js";

/* import styles for webpack MiniCssExtractPlugin plugin */
// highlight.js css must be imported before diff2html css
import "../css/highlight.js.css";
import "../css/diff2html.css";

import "../css/d2h-hook/file-rating.css";
import "../css/d2h-hook/line-rating.css";
import "../css/d2h-hook/global-styles.css";

function fillGitDiffContainer(container, diff, categorizedFiles)
{
    const diff2htmlUi = new Diff2HtmlUI(container, diff,
    {
        matching: "lines",
        outputFormat: "side-by-side"
    });
    
    diff2htmlUi.draw();
    
    let ratedFiles = createRatedFiles(container, categorizedFiles);

    return {
        ratedFiles: ratedFiles,
        gitDiffContainer: container
    };
}

const makeHeader = header => `<Header value="${header}:" size="5" style="font-weight: bold"/>`
const makeHeaderValue = value => `<Header value="$${value}" size="5" style="font-weight: normal;padding-left: 3%"/>`;

const makeRow = (header, value) => makeHeader(header) + makeHeaderValue(value);

const GIT_DIFF_CONTAINER_ID = "git-diff-container";

const CONFIG =
`
<View>
    <Collapse bordered="true">
        <Panel value="CVE entry">
            <View>
                ${makeRow("Name", "id")}
                ${makeRow("Published at", "publicationDate")}
                ${makeRow("Severity score", "severityScore")}
                ${makeRow("Description", "summary")}
            </View>
        </Panel>
    </Collapse>

    <Collapse bordered="true">
        <Panel value="Error creation date">
            <View>
                <Text name="error-creation-name-text" value="Specify the date when the error was created:"/>
                <DateTime toname="error-creation-name-text" name="error-creation-date" required="true"/>
            </View>
        </Panel>
    </Collapse>

    <Collapse bordered="true">
        <Panel value="Changes in files">
            <View>
                <HyperText name="git-diff" inline="true">
                    <div id="${GIT_DIFF_CONTAINER_ID}"/>
                </HyperText>
            </View>
        </Panel>
    </Collapse>
</View>
`;

const getSelectedCategory = dropDownList => dropDownList.value;

function serializeRatedLine(ratedLine)
{
    return {
        lineNumber: ratedLine.lineNumber,
        category: getSelectedCategory(ratedLine.dropDownList)
    };
}

function serializeRatedFile(ratedFile)
{
    return {
        fileName: ratedFile.fileName,
        category: getSelectedCategory(ratedFile.dropDownList),
        lines:
        {
            beforeChange: ratedFile.ratedLinesBeforeChange.map(serializeRatedLine),
            afterChange: ratedFile.ratedLinesAfterChange.map(serializeRatedLine)
        }
    };
}

function onGitDiffContainerCreated(annotation, gitDiffContainer, gitDiff, categorizedFiles)
{
    const originalSerializeAnnotation = annotation.serializeAnnotation.bind(annotation);

    annotation.serializeAnnotation = options =>
    {
        let serialized = originalSerializeAnnotation(options);

        // append serialized cve annotation data
        let cve =
        {
            type: "cve",
            value:
            {
                files: annotation.cve.ratedFiles.map(serializeRatedFile)
            }
        };

        serialized.push(cve);

        return serialized;
    };

    annotation.cve = fillGitDiffContainer(gitDiffContainer, gitDiff, categorizedFiles);
}

function createMutationObserver(annotationGetter, gitDiff)
{
    const observer = new MutationObserver(mutationList =>
    {
        // if the mutation wasn't about unfolding Collapse tag then skip it
        if(mutationList.length > 1)
            return;
        
        let target = mutationList[0].target;

        // same check as above
        if(!target.classList.contains("ant-collapse-item"))
            return;
        
        let gitDiffContainer = document.getElementById(GIT_DIFF_CONTAINER_ID);

        if(!gitDiffContainer)
            return;
        
        // if this unfolded Collapse tag didn't contain the git diff container
        // then it wasn't the tag we were waiting for
        if(!target.contains(gitDiffContainer))
            return;
        
        const annotation = annotationGetter();

        const cve = annotation.cve;

        let container = cve.gitDiffContainer;

        // when opening back the previously created annotation
        if(container)
        {
            gitDiffContainer.replaceWith(container);

            return;
        }

        // annotation is loaded for the first time
        // (it's supposed to contain either previously saved categorization
        // or initial categorization gained in some other way, e.g. using a heuristic)
        onGitDiffContainerCreated(annotation, gitDiffContainer, gitDiff, cve.categorizedFiles);
    });

    observer.observe(document.getElementById("label-studio"),
    {
        childList: true,
        subtree: true
    });
}

function onLabelStudioConstructor(labelStudio)
{
    createCategories();
    
    const data =
    {
        "id": "CVE-2000-1111",
        "publicationDate": "1 stycznia 2000 18:10",
        "severityScore": "7",
        "summary": "example cve",
        "gitDiff": "diff --git a/sample.js b/sample.js\nindex 0000001..0ddf2ba\n--- a/sample.js\n+++ b/sample.js\n@@ -1 +1 @@\n-console.log(\"Hello World!\")\n+console.log(\"Hello from Diff2Html!\")"
    };

    labelStudio.options =
    {
        config: CONFIG,
        interfaces:
        [
            "panel",
            "update",
            "submit",
            "skip",
            "controls",
            //"review",
            "infobar",
            "topbar",
            "instruction",
            "side-column",
            "ground-truth",
            "annotations:tabs",
            "annotations:menu",
            "annotations:current",
            "annotations:add-new",
            "annotations:delete",
            'annotations:view-all',
            "predictions:tabs",
            "predictions:menu",
      ],
        user: {
            "id": 1,
            "first_name": "Nick",
            "last_name": "Skriabin",
            "username": "nick",
            "email": "nick@heartex.ai",
            "avatar": null,
            "initials": "ni",
          },
          users: [
            {
              "id": 1,
              "first_name": "Nick",
              "last_name": "Skriabin",
              "username": "nick",
              "email": "nick@heartex.ai",
              "avatar": null,
              "initials": "ni",
            }
          ],
        task:
        {
            annotations:
            [{
                "result":
                [
                    {
                        "value": {
                        "datetime": "2001-05-30T16:50"
                        },
                        "id": "LzjJfZ8htQ",
                        "from_name": "error-creation-date",
                        "to_name": "error-creation-name-text",
                        "type": "datetime",
                        "origin": "manual"
                    },
                    {
                        "type": "cve",
                        "value":
                        {
                            "files":
                            [
                                {
                                    "fileName": "sample.js",
                                    "category": "Code",
                                    "lines":
                                    {
                                        "beforeChange": [
                                        {
                                            "lineNumber": 1,
                                            "category": "Documentation"
                                        }
                                        ],
                                        "afterChange": [
                                        {
                                            "lineNumber": 1,
                                            "category": "Test"
                                        }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }],
            predictions: [],
            id: 1,
            data: data
        }
    };

    const events = labelStudio.events;

    events.on("labelStudioLoad", labelStudio =>
    {
        let annotation = labelStudio.annotationStore.addAnnotation
        ({
            userGenerate: true
        });
        
        labelStudio.annotationStore.selectAnnotation(annotation.id);
    });

    let currentAnnotation = null;

    createMutationObserver(() => currentAnnotation, data.gitDiff);

    events.on("selectAnnotation", annotation =>
    {
        currentAnnotation = annotation;

        // if this annotation has already been selected before then skip modifying its properties
        if(annotation.cve)
            return;

        annotation.cve = {};

        const originalDeserializeResults = annotation.deserializeResults.bind(annotation);

        annotation.deserializeResults = (results, options) =>
        {
            originalDeserializeResults(results, options);
    
            // find a cve result (there's only 1 at most)
            let cve = results.find(result => result.type === "cve");
            
            if(!cve)
                return;
            
            annotation.cve.categorizedFiles = cve.value.files;
        };
        
        console.log("Selected annotation. CVE:");
        console.log(annotation.cve);
    });

    events.on("deleteAnnotation", () => console.log("Delete annotation"));

    events.on("submitAnnotation", (labelStudio, annotation) =>
    {
        console.log("Submit annotation");

        let serialized = annotation.serializeAnnotation();
        console.log(serialized);
        console.log(JSON.stringify(serialized.at(-1).cve, null, 2));
    });
}

export {
    onLabelStudioConstructor
};