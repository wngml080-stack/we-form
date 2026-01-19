"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  HelpCircle,
  Copy,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KakaoChannelSettings {
  id?: string;
  gym_id: string;
  company_id: string;
  channel_id?: string;
  channel_public_id?: string;
  channel_name?: string;
  rest_api_key?: string;
  admin_key?: string;
  webhook_secret?: string;
  chatbot_enabled: boolean;
  alimtalk_enabled: boolean;
  alimtalk_sender_key?: string;
  alimtalk_sender_number?: string;
  is_verified: boolean;
  verified_at?: string;
}

interface KakaoChannelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymId: string;
  companyId: string;
  gymName?: string;
}

export function KakaoChannelSettingsModal({
  isOpen,
  onClose,
  gymId,
  companyId,
  gymName,
}: KakaoChannelSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [settings, setSettings] = useState<KakaoChannelSettings>({
    gym_id: gymId,
    company_id: companyId,
    chatbot_enabled: false,
    alimtalk_enabled: false,
    is_verified: false,
  });

  // 웹훅 URL (배포 도메인에 맞게 변경 필요)
  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/kakao/message`
    : "";
  const skillServerUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/kakao/skill`
    : "";

  useEffect(() => {
    if (isOpen && gymId) {
      fetchSettings();
    }
  }, [isOpen, gymId]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/kakao-channel?gym_id=${gymId}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings({
            ...data,
            gym_id: gymId,
            company_id: companyId,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch kakao channel settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/kakao-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        alert("저장되었습니다.");
      } else {
        const error = await response.json();
        alert(error.error || "저장 실패");
      }
    } catch (error) {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch("/api/admin/kakao-channel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gym_id: gymId, action: "verify" }),
      });

      const data = await response.json();
      if (data.success) {
        setSettings({ ...settings, is_verified: true });
        alert(data.message);
      } else {
        alert(data.message || "연동 확인 실패");
      }
    } catch (error) {
      alert("연동 확인 중 오류가 발생했습니다.");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("복사되었습니다.");
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-3 xs:p-4 sm:p-6 rounded-xl sm:rounded-lg">
          <DialogTitle className="sr-only">카카오 채널 설정 로딩 중</DialogTitle>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-3 xs:p-4 sm:p-6 rounded-xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-yellow-500" />
            카카오 채널 연동 설정
            {gymName && <span className="text-sm font-normal text-muted-foreground">- {gymName}</span>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="channel" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="channel">채널 설정</TabsTrigger>
            <TabsTrigger value="chatbot">챗봇 설정</TabsTrigger>
            <TabsTrigger value="alimtalk">알림톡</TabsTrigger>
          </TabsList>

          {/* 채널 기본 설정 */}
          <TabsContent value="channel" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">연동 상태</span>
                {settings.is_verified ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    연동됨
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    미연동
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerify}
                disabled={isVerifying || !settings.admin_key}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "연동 확인"
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="channel_name">채널 이름</Label>
                <Input
                  id="channel_name"
                  placeholder="예: OO피트니스"
                  value={settings.channel_name || ""}
                  onChange={(e) => setSettings({ ...settings, channel_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="channel_public_id">
                  채널 검색용 ID
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 ml-1 inline" />
                      </TooltipTrigger>
                      <TooltipContent>
                        카카오톡에서 검색되는 @로 시작하는 ID
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="channel_public_id"
                  placeholder="@채널ID"
                  value={settings.channel_public_id || ""}
                  onChange={(e) => setSettings({ ...settings, channel_public_id: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="channel_id">채널 ID (숫자)</Label>
                <Input
                  id="channel_id"
                  placeholder="카카오 비즈니스에서 확인"
                  value={settings.channel_id || ""}
                  onChange={(e) => setSettings({ ...settings, channel_id: e.target.value })}
                />
              </div>

              <div className="pt-2 border-t">
                <Label htmlFor="rest_api_key" className="flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  REST API 키
                </Label>
                <Input
                  id="rest_api_key"
                  type="password"
                  placeholder="카카오 디벨로퍼스에서 발급"
                  value={settings.rest_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, rest_api_key: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="admin_key" className="flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  Admin 키 (중요)
                </Label>
                <Input
                  id="admin_key"
                  type="password"
                  placeholder="카카오 디벨로퍼스에서 발급"
                  value={settings.admin_key || ""}
                  onChange={(e) => setSettings({ ...settings, admin_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  채널 메시지 발송에 필요합니다. 절대 외부에 노출하지 마세요.
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">카카오 디벨로퍼스 설정 방법</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>developers.kakao.com 접속 후 로그인</li>
                <li>내 애플리케이션 → 앱 만들기</li>
                <li>앱 설정 → 앱 키에서 REST API 키, Admin 키 복사</li>
                <li>카카오 로그인 → 활성화 설정</li>
              </ol>
              <a
                href="https://developers.kakao.com/console/app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
              >
                카카오 디벨로퍼스 바로가기
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </TabsContent>

          {/* 챗봇 설정 */}
          <TabsContent value="chatbot" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">AI 챗봇 자동 응답</p>
                <p className="text-xs text-muted-foreground">
                  카카오 채널 메시지에 AI가 자동으로 응답합니다
                </p>
              </div>
              <Switch
                checked={settings.chatbot_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, chatbot_enabled: checked })
                }
              />
            </div>

            <div>
              <Label htmlFor="webhook_secret">Webhook Secret</Label>
              <Input
                id="webhook_secret"
                type="password"
                placeholder="선택사항 - 보안 강화용"
                value={settings.webhook_secret || ""}
                onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
              />
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg space-y-3">
              <p className="text-sm font-medium text-yellow-800">카카오 i 오픈빌더 설정</p>
              <p className="text-xs text-yellow-700">
                AI 챗봇을 사용하려면 카카오 i 오픈빌더에서 스킬 서버를 등록해야 합니다.
              </p>

              <div>
                <p className="text-xs text-yellow-800 font-medium mb-1">Webhook URL (메시지 수신용)</p>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="text-xs bg-white" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs text-yellow-800 font-medium mb-1">스킬 서버 URL (챗봇용)</p>
                <div className="flex gap-2">
                  <Input value={skillServerUrl} readOnly className="text-xs bg-white" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(skillServerUrl)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <a
                href="https://i.kakao.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yellow-600 hover:underline flex items-center gap-1"
              >
                카카오 i 오픈빌더 바로가기
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </TabsContent>

          {/* 알림톡 설정 */}
          <TabsContent value="alimtalk" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">알림톡 발송</p>
                <p className="text-xs text-muted-foreground">
                  예약 확인, 리마인더 등을 알림톡으로 발송합니다
                </p>
              </div>
              <Switch
                checked={settings.alimtalk_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, alimtalk_enabled: checked })
                }
              />
            </div>

            {settings.alimtalk_enabled && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="alimtalk_sender_key">발송 서비스 API 키</Label>
                  <Input
                    id="alimtalk_sender_key"
                    type="password"
                    placeholder="솔라피, NHN Cloud 등의 API 키"
                    value={settings.alimtalk_sender_key || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, alimtalk_sender_key: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="alimtalk_sender_number">발신 번호</Label>
                  <Input
                    id="alimtalk_sender_number"
                    placeholder="010-0000-0000"
                    value={settings.alimtalk_sender_number || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, alimtalk_sender_number: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    발신 번호는 사전에 등록/인증이 필요합니다
                  </p>
                </div>
              </div>
            )}

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">알림톡 발송 서비스 안내</p>
              <p className="text-xs text-muted-foreground mb-2">
                알림톡은 별도의 발송 대행 서비스를 통해 발송됩니다.
                아래 서비스 중 하나를 선택하여 가입 후 API 키를 입력해주세요.
              </p>
              <div className="flex gap-2">
                <a
                  href="https://solapi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  솔라피
                </a>
                <span className="text-xs text-muted-foreground">|</span>
                <a
                  href="https://www.nhncloud.com/kr/service/notification/alimtalk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  NHN Cloud
                </a>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
