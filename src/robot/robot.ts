/**
 * Robot class - represents a saved workflow that can be executed
 */

import { RunResult, RobotData, ScheduleConfig,  CrawlConfig, SearchConfig, WebhookConfig, ExecutionOptions, Run } from '../types';
import { Client } from '../client/maxun-client';

export class Robot {
  protected client: Client;
  protected robotData: RobotData;

  constructor(client: Client, robotData: RobotData) {
    this.client = client;
    this.robotData = robotData;
  }

  /**
   * Get the robot ID
   */
  get id(): string {
    return this.robotData.recording_meta.id;
  }

  /**
   * Get the robot name
   */
  get name(): string {
    return this.robotData.recording_meta.name;
  }

  /**
   * Get the full robot data
   */
  getData(): RobotData {
    return this.robotData;
  }

  /**
   * Execute the robot
   */
  async run(options?: ExecutionOptions): Promise<RunResult> {
    return await this.client.executeRobot(this.id, options);
  }

  /**
   * Get all runs for this robot
   */
  async getRuns(): Promise<Run[]> {
    return await this.client.getRuns(this.id);
  }

  /**
   * Get a specific run
   */
  async getRun(runId: string): Promise<Run> {
    return await this.client.getRun(this.id, runId);
  }

  /**
   * Get the latest run
   */
  async getLatestRun(): Promise<Run | null> {
    const runs = await this.getRuns();
    if (runs.length === 0) return null;

    // Sort by startedAt descending
    runs.sort((a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return runs[0];
  }

  /**
   * Abort a running or queued run
   */
  async abort(runId: string): Promise<void> {
    await this.client.abortRun(this.id, runId);
  }

  /**
   * Schedule the robot for periodic execution
   */
  async schedule(config: ScheduleConfig): Promise<void> {
    const updated = await this.client.scheduleRobot(this.id, config);
    this.robotData = updated;
  }

  /**
   * Remove the schedule
   */
  async unschedule(): Promise<void> {
    const updated = await this.client.unscheduleRobot(this.id);
    this.robotData = updated;
  }

  /**
   * Add a webhook
   */
  async addWebhook(webhook: WebhookConfig): Promise<void> {
    const updated = await this.client.addWebhook(this.id, webhook);
    this.robotData = updated;
  }

  /**
   * Update the robot's workflow or metadata
   */
  async update(updates: { meta?: Partial<RobotData['recording_meta']>; workflow?: any[] }): Promise<void> {
    const updated = await this.client.updateRobot(this.id, updates as any);
    this.robotData = updated;
  }
  /**
   * Update the list limit for a scrape-list action in this robot's workflow.
   *
   * @param limit - The new maximum number of items to collect.
   * @param location - Which scrape-list action to target within the workflow,
   *   using its position (pairIndex/actionIndex/argIndex). Defaults to the
   *   first pair/action/arg (0, 0, 0), which covers the common case of a
   *   robot with a single scrape-list step.
   */
  async updateListLimit(
    limit: number,
    location: { pairIndex?: number; actionIndex?: number; argIndex?: number } = {}
  ): Promise<void> {
    const {
      pairIndex = 0,
      actionIndex = 0,
      argIndex = 0
    } = location;

    // Debug log — must come AFTER the destructuring above,
    // since that's what defines pairIndex/actionIndex/argIndex
    console.log('Sending limits update:', JSON.stringify({
      limits: [{ pairIndex, actionIndex, argIndex, limit }]
    }));

    const updated = await this.client.updateRobot(this.id, {
      limits: [{ pairIndex, actionIndex, argIndex, limit }]
    } as any);

    this.robotData = updated;
  }

  /**
 * Update saved credentials (e.g. login username/password) used by this
 * robot's workflow. Keys must match the exact selector used in the
 * workflow's type/click actions for the corresponding field.
 */
  async updateCredentials(
    credentials: Record<string, { value: string; type: string }>
  ): Promise<void> {
    const updated = await this.client.updateRobot(this.id, {
      credentials
    } as any);

    this.robotData = updated;
  }

  /**
   * Update the starting URL this robot scrapes/crawls. Internally routed
   * through the same meta.url mechanism the backend already supports —
   * this method exists purely for a cleaner, more discoverable API rather
   * than requiring callers to know to nest the URL inside `meta`.
   */
  async updateTargetUrl(url: string): Promise<void> {
    const updated = await this.client.updateRobot(this.id, {
      meta: { url }
    } as any);

    this.robotData = updated;
  }
  async updateCrawlConfig(config: Partial<CrawlConfig>): Promise<void> {
    const updated = await this.client.updateRobot(this.id, {
      crawlConfig: config
    } as any);

    this.robotData = updated;
  }
  async updateSearchConfig(config: Partial<SearchConfig>): Promise<void> {
    const updated = await this.client.updateRobot(this.id, {
      searchConfig: config
    } as any);

    this.robotData = updated;
  }
  /**
   * Get all webhooks for this robot
   */
  getWebhooks(): WebhookConfig[] | null {
    return this.robotData.webhooks || null;
  }

  /**
   * Remove all webhooks
   */
  async removeWebhooks(): Promise<void> {
    const updated = await this.client.updateRobot(this.id, {
      webhooks: null,
    } as any);
    this.robotData = updated;
  }

  /**
   * Get schedule configuration
   */
  getSchedule(): ScheduleConfig | null {
    return this.robotData.schedule || null;
  }

  /**
   * Duplicate the robot with a new target URL
   */
  async duplicate(targetUrl: string): Promise<Robot> {
    const newRobotData = await this.client.duplicateRobot(this.id, targetUrl);
    return new Robot(this.client, newRobotData);
  }

  /**
   * Delete the robot
   */
  async delete(): Promise<void> {
    await this.client.deleteRobot(this.id);
  }

  /**
   * Refresh robot data from server
   */
  async refresh(): Promise<void> {
    this.robotData = await this.client.getRobot(this.id);
  }
}
