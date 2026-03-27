require_dependency "jwt_denylist"
class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :project_memberships
  has_many :projects, through: :project_memberships
  has_many :tasks

  validates :first_name, :last_name, presence: true

  scope :search, ->(query) {
    where("LOWER(email) LIKE ? OR LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?",
          "%#{query}%", "%#{query}%", "%#{query}%")
  }

  def full_name
    "#{first_name} #{last_name}"
  end

  def jwt_secret_key
    Rails.application.credentials.devise_jwt_secret_key || ENV["DEVISE_JWT_SECRET_KEY"] || "fallback_secret_key_for_development_only"
  end

  def token
    JWT.encode({ user_id: id, exp: 1.day.from_now.to_i }, jwt_secret_key)
  end

  def self.from_jwt_token(token)
    return nil if token.blank?
    secret = Rails.application.credentials.devise_jwt_secret_key || ENV["DEVISE_JWT_SECRET_KEY"] || "fallback_secret_key_for_development_only"
    decoded = JWT.decode(token, secret, true, { algorithm: "HS256" }).first
    user_id = decoded["user_id"]
    find_by(id: user_id)
  rescue JWT::DecodeError => e
    nil
  rescue JWT::ExpiredSignature
    nil
  end
end
