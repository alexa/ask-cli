const path = require("path");
const chai = require("chai");
const fs = require("fs-extra");
const sinonChai = require("sinon-chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.use(sinonChai);

process.env.ASK_SHARE_USAGE = false;
