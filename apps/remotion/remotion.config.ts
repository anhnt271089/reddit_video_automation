import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');

// Output configuration
Config.setOutputLocation('out/');

export default {};
