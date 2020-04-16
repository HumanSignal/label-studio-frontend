import config from "./config.xml";
import tasks from "./tasks.json";
import completion from "./completions/1.json";

// const data = tasks[0].data;
// data.time = data.time.slice(0, 1000);
// data.sensor1 = data.sensor1.slice(0, 1000);
// data.sensor2 = data.sensor2.slice(0, 1000);

export const TimeSeries = { config, tasks, completion };
