import App from "../src/App";
import { getCatalog } from "./catalog";
import { demoDeployment } from "./deployment.mjs";
export default async function DemoPage({ screen }) {
  return <App catalog={await getCatalog()} initialScreen={screen} routingMode="path" backend={demoDeployment(process.env).backend}/>;
}
